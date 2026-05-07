import React from "react";

const StoryCardSkeleton = () => {
  return (
    <div className="p-4 border-b border-[#2f3336] animate-pulse">
      <div className="flex gap-3">
        {/* Avatar Skeleton */}
        <div className="w-10 h-10 rounded-full bg-[#2f3336]" />
        
        <div className="flex-1 space-y-3">
          {/* Header Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-[#2f3336] rounded" />
            <div className="h-4 w-16 bg-[#2f3336] rounded" />
          </div>
          
          {/* Content Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#2f3336] rounded" />
            <div className="h-4 w-3/4 bg-[#2f3336] rounded" />
          </div>

          {/* Footer Actions Skeleton */}
          <div className="flex justify-between items-center pt-2 max-w-md">
            <div className="h-4 w-12 bg-[#2f3336] rounded" />
            <div className="h-4 w-12 bg-[#2f3336] rounded" />
            <div className="h-4 w-12 bg-[#2f3336] rounded" />
            <div className="h-4 w-12 bg-[#2f3336] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCardSkeleton;
