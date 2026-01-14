import { createContext } from "react";
import useLocalStorageState from "use-local-storage-state";

export const EmailContext = createContext<any>(null);

export const EmailProvider = ({ children }: any) => {
  const [draft, setDraft] = useLocalStorageState("email-draft", {
    defaultValue: {
      from: "",
      to: "",
      cc: "",
      subject: "",
      body: "",
      attachments: [],
    },
  });

  const updateDraft = (field: string, value: any) =>
    setDraft((prev: any) => ({ ...prev, [field]: value }));

  const clearDraft = () =>
    setDraft({
      from: "",
      to: "",
      cc: "",
      subject: "",
      body: "",
      attachments: [],
    });

  // ✅ ADD THIS
  const setFromEmail = (email: string) => {
    setDraft((prev: any) => ({
      ...prev,
      from: email,
    }));
  };

  // ✅ EXPORT IT
  const value = { draft, updateDraft, clearDraft, setFromEmail };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};
