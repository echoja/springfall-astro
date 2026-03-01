import { twMerge } from "tailwind-merge";
import style from "./style.module.css";

export default function ArticleImage({
  src,
  caption,
  alt,
  width,
  noShadow,
  border,
}: {
  src: string;
  caption?: React.ReactNode;
  width?: number;
  alt: string;
  noShadow?: boolean;
  border?: boolean;
}) {
  return (
    <figure className={style["image-figure"]}>
      <img
        className={twMerge(
          style.image,
          noShadow && style["no-shadow"],
          border && style["image-border"],
        )}
        width={width}
        src={src}
        alt={alt}
        loading="lazy"
      />
      {caption && (
        <figcaption className={style["image-caption"]}>{caption}</figcaption>
      )}
    </figure>
  );
}
