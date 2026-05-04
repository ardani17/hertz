import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          
          // Find admin by username or email
          const admin = await Admin.findOne({
            $or: [
              { username: credentials.username },
              { email: credentials.username }
            ]
          });

          if (!admin) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            admin.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: admin._id.toString(),
            username: admin.username,
            email: admin.email,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.username as string,
          email: token.email as string,
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/ghost-admin/login',
    error: '/ghost-admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type declarations for NextAuth
declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    email: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    email: string;
  }
}