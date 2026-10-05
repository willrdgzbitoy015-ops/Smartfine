import { Redirect } from "expo-router";

// Add New Officer is a pop-up in the Officers directory. Links to this
// route open that pop-up instead.
export default function AddOfficerRedirect() {
  return <Redirect href={{ pathname: "/admin/officers", params: { add: "1" } }} />;
}
