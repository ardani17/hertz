"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface AnnouncementData {
  _id: string;
  destinationUrl: string;
  imageUrl: string;
  imageName: string;
  isActive: boolean;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AnnouncementPopupProps {
  // Props bisa ditambahkan sesuai kebutuhan
}

export default function AnnouncementPopup({}: AnnouncementPopupProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcement/active');
      const result = await response.json();
      
      if (result.success && result.data) {
        const announcementId = result.data._id;
        
        // Check if user has already seen this announcement
        const seenAnnouncements = JSON.parse(
          localStorage.getItem('seenAnnouncements') || '[]'
        );
        
        if (!seenAnnouncements.includes(announcementId)) {
          setAnnouncement(result.data);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (announcement) {
      // Mark this announcement as seen
      const seenAnnouncements = JSON.parse(
        localStorage.getItem('seenAnnouncements') || '[]'
      );
      seenAnnouncements.push(announcement._id);
      localStorage.setItem('seenAnnouncements', JSON.stringify(seenAnnouncements));
    }
    
    setIsVisible(false);
  };

  const handleImageClick = () => {
    if (announcement?.destinationUrl) {
      window.open(announcement.destinationUrl, '_blank', 'noopener,noreferrer');
      handleClose(); // Close popup after clicking
    }
  };

  // Don't render anything if loading or no announcement
  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Popup Container */}
        <div 
          className="relative bg-transparent rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Container */}
          <div className="relative">
            <Image
              src={announcement.imageUrl}
              alt={announcement.imageName}
              width={800}
              height={600}
              className="w-full h-auto max-h-[80vh] object-contain cursor-pointer transition-transform hover:scale-105 rounded-lg"
              onClick={handleImageClick}
              priority
            />
            
            {/* Click Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-lg">
              <Button
                onClick={handleImageClick}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-base transition-all duration-300 transform hover:scale-105"
              >
                Join Event Sekarang
              </Button>
            </div>
          </div>

          {/* Close Button - Positioned below image */}
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="bg-transparent hover:bg-white/10 text-white font-medium px-4 py-2 rounded-full transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}