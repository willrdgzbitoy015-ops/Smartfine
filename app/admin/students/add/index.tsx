import { Redirect } from "expo-router";

// Add New Student is a pop-up in the Students directory. Links to this
// route open that pop-up instead.
export default function AddStudentRedirect() {
  return <Redirect href={{ pathname: "/admin/students", params: { add: "1" } }} />;
}
