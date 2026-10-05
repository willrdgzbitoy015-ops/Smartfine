import { Redirect, useLocalSearchParams } from "expo-router";

// Edit Fine is a pop-up in the Fines Directory. Links to this route open
// that pop-up for the fine.
export default function EditFineRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fineId = Array.isArray(id) ? id[0] : id;

  return (
    <Redirect
      href={{
        pathname: "/admin/fines",
        params: { fineId: String(fineId ?? ""), edit: "1" },
      }}
    />
  );
}
