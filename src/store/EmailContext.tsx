import { createContext } from "react";
import useLocalStorageState from "use-local-storage-state";

export const EmailContext = createContext(null);

export const EmailProvider = ({ children }) => {
  const [draft, setDraft] = useLocalStorageState("email-draft", {
    defaultValue: {
      from: "agent@company.com",
      to: "",
      cc: "",
      subject: "",
      body: "",
    },
  });

  const updateDraft = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const clearDraft = () =>
    setDraft({
      from: "agent@company.com",
      to: "",
      cc: "",
      subject: "",
      body: "",
    });

  const value = { draft, updateDraft, clearDraft };

  return (
    <EmailContext.Provider value={value}>{children}</EmailContext.Provider>
  );
};
