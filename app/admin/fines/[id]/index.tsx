import { Redirect, useLocalSearchParams } from "expo-router";

// Fine details are a pop-up in the Fines Directory. Links to this route
// (for example from a student's profile) open that pop-up instead.
export default function FineDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fineId = Array.isArray(id) ? id[0] : id;

  return (
    <Redirect
      href={{ pathname: "/admin/fines", params: { fineId: String(fineId ?? "") } }}
    />
  );
}
