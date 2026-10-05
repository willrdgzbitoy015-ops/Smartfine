import { Redirect, useLocalSearchParams } from "expo-router";

// Edit Information is a pop-up on the officer's profile. Links to this
// route open the profile with that pop-up.
export default function EditOfficerRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const officerId = Array.isArray(id) ? id[0] : id;

  return (
    <Redirect
      href={{
        pathname: "/admin/officers/[id]",
        params: { id: String(officerId ?? ""), edit: "1" },
      }}
    />
  );
}
