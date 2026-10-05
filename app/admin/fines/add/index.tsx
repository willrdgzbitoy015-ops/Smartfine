import { Redirect, useLocalSearchParams } from "expo-router";

// Add New Fine is a pop-up in the Fines Directory. Links to this route open
// that pop-up instead, keeping a student picked on the QR Scanner.
export default function AddFineRedirect() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const picked = Array.isArray(studentId) ? studentId[0] : studentId;

  return (
    <Redirect
      href={{
        pathname: "/admin/fines",
        params: picked ? { add: "1", studentId: String(picked) } : { add: "1" },
      }}
    />
  );
}
