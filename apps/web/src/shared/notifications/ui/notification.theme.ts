export type NotificationTheme = {
  base: {
    style: React.CSSProperties;
    duration: number;
  };

  variants: {
    success: {
      style: React.CSSProperties;
      duration?: number;
    };
    error: {
      style: React.CSSProperties;
      duration?: number;
    };
    info: {
      style: React.CSSProperties;
    };
    warning: {
      style: React.CSSProperties;
    };
  };
};
