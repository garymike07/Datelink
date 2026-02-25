import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Info, Star } from "lucide-react";
import { DistanceBadge } from "./DistanceBadge";

interface Photo {
  _id?: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface Profile {
  userId: string;
  name: string;
  age: number;
  location?: string;
  jobTitle?: string;
  bio?: string;
  photos: Photo[];
  interests: string[];
  isPremium?: boolean;
  distanceKm?: number | null;
  distanceCity?: string | null;
  passportMode?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  currentUserId?: string;
  onInfoClick?: () => void;
}

export function ProfileCard({ profile, onInfoClick }: ProfileCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!profile) return null;

  const sortedPhotos = [...(profile.photos || [])].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.order - b.order;
  });

  const currentPhoto = sortedPhotos[photoIndex];
  const hasMultiplePhotos = sortedPhotos.length > 1;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : sortedPhotos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev < sortedPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card select-none">
      {/* Photo */}
      {currentPhoto ? (
        <img
          src={currentPhoto.url}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center">
          <span className="text-6xl font-bold text-white/80">
            {profile.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
      )}

      {/* Photo navigation dots */}
      {hasMultiplePhotos && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
          {sortedPhotos.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === photoIndex ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Photo navigation tap zones */}
      {hasMultiplePhotos && (
        <>
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-10 opacity-0"
            onClick={handlePrevPhoto}
            aria-label="Previous photo"
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-10 opacity-0"
            onClick={handleNextPhoto}
            aria-label="Next photo"
          />
        </>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Premium badge */}
      {profile.isPremium && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 gap-1">
            <Star className="w-3 h-3 fill-white" />
            Premium
          </Badge>
        </div>
      )}

      {/* Info button */}
      {onInfoClick && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
        >
          <Info className="w-5 h-5" />
        </Button>
      )}

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 pointer-events-none">
        <div className="space-y-2">
          {/* Name and age */}
          <div className="flex items-end gap-2">
            <h2 className="text-2xl font-bold text-white leading-tight">
              {profile.name}
            </h2>
            <span className="text-xl font-semibold text-white/90 mb-0.5">
              {profile.age}
            </span>
          </div>

          {/* Job title */}
          {profile.jobTitle && (
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profile.jobTitle}</span>
            </div>
          )}

          {/* Location / Distance */}
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              <DistanceBadge 
                distanceKm={profile.distanceKm} 
                city={profile.distanceCity || profile.location} 
                passportMode={profile.passportMode} 
              />
            </span>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {profile.interests.slice(0, 4).map((interest, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs px-2 py-0.5"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 4 && (
                <Badge
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs px-2 py-0.5"
                >
                  +{profile.interests.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
