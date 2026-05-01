import { onlineManager } from "@tanstack/react-query";

if (typeof window !== "undefined") {
  onlineManager.setEventListener((setOnline) => {
    const update = () => {
      const online = navigator.onLine;

      setOnline(online);
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  });
}
