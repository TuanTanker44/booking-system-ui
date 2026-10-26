import { useState } from "react";

// Chữ cái đầu của từ đầu và từ cuối trong tên ("Ngô Tuấn" -> "NT")
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";

  return (first + last).toLocaleUpperCase("vi");
}

interface AvatarProps {
  name: string;
  // Ảnh đại diện; thiếu hoặc tải lỗi thì hiện chữ cái đầu của tên
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div className={className} title={name}>
      {showImage ? (
        <img
          className="avatar-image"
          src={src ?? undefined}
          alt={name}
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
