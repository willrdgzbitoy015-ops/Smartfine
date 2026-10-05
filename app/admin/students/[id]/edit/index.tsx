import { Redirect, useLocalSearchParams } from "expo-router";

// Edit Student Information is a pop-up on the student's profile. Links to
// this route open the profile with that pop-up.
export default function EditStudentRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Array.isArray(id) ? id[0] : id;

  return (
    <Redirect
      href={{
        pathname: "/admin/students/[id]",
        params: { id: String(studentId ?? ""), edit: "1" },
      }}
    />
  );
}
