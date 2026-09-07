import styles from "./DemoFaces.module.css";

type FaceProps = {
  className?: string;
};

const LEFT_PAREN =
  "M86.77,115.51v-11.49h-11.5v11.49h-11.49v11.49h-11.49v45.99h11.49v-45.99h11.49v-11.49h11.5ZM75.27,172.99v11.49h11.5v11.5h-11.5v-11.5h-11.49v-11.49h11.49Z";

const LEFT_EYE =
  "M132.76,127v11.49h11.49v-11.49h-11.49v-11.49h-11.5v-11.49h-11.49v11.49h-11.49v11.49h-11.49v11.49h11.49v-11.49h11.49v-11.49h11.49v11.49h11.5Z";

const MOUTH =
  "M109.76,161.49v11.49h11.49v11.49h68.98v-11.49h11.49v-11.49h-11.49v11.49h-68.98v-11.49h-11.49Z";

const RIGHT_PAREN =
  "M236.23,172.99v-45.99h-11.49v-11.49h-11.5v-11.49h11.5v11.49h11.49v11.49h11.49v45.99h-11.49Z";

const RIGHT_CHEEK =
  "M224.73,172.99v11.49h-11.5v11.5h11.5v-11.5h11.49v-11.49h-11.49Z";

const RIGHT_EYE_OPEN =
  "M198.76,127v11.49h11.49v-11.49h-11.49v-11.49h-11.5v-11.49h-11.49v11.49h-11.49v11.49h-11.49v11.49h11.49v-11.49h11.49v-11.49h11.49v11.49h11.5Z";

const RIGHT_EYE_WINK = "M167.25,138.5h45.99v-11.49h-45.99v11.49Z";

export function DemoFaceWink({ className = "" }: FaceProps) {
  return (
    <svg
      className={`${styles.face} ${className}`.trim()}
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path d={LEFT_PAREN} />
        <path d={LEFT_EYE} />
        <path d={MOUTH} />
        <path d={RIGHT_PAREN} />
        <path d={RIGHT_CHEEK} />
        <path className={styles.eyeOpen} d={RIGHT_EYE_OPEN} />
        <path className={styles.eyeClosed} d={RIGHT_EYE_WINK} />
      </g>
    </svg>
  );
}

export function DemoFaceNeutral({ className = "" }: FaceProps) {
  return (
    <svg
      className={`${styles.face} ${className}`.trim()}
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M89.07,113.44v-12.19h-12.18v12.19h-12.19v12.18h-12.19v48.75h12.19v-48.75h12.19v-12.18h12.18ZM174.38,198.75v-12.19h-48.75v12.19h48.75ZM223.12,174.38v12.18h-12.19v12.19h12.19v-12.19h12.18v-12.18h-12.18ZM235.3,174.37v-48.75h-12.18v-12.18h-12.19v-12.19h12.19v12.19h12.18v12.18h12.19v48.75h-12.19ZM174.38,174.37h24.37v-12.18h12.19v-36.57h-12.19v-12.18h-24.37v12.18h-12.19v36.57h12.19v12.18ZM198.75,162.19h-24.37v-36.57h24.37v36.57ZM101.25,174.37h24.38v-12.18h12.18v-36.57h-12.18v-12.18h-24.38v12.18h-12.19v36.57h12.19v12.18ZM125.63,162.19h-24.38v-36.57h24.38v36.57ZM76.89,174.38v12.18h12.18v12.19h-12.18v-12.19h-12.19v-12.18h12.19Z"
      />
    </svg>
  );
}
