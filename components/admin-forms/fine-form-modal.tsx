import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import {
  Banner,
  FormField,
  FormInput,
  FormPopup,
  FormRow,
  OptionList,
  PopupButton,
  ReadOnlyValue,
  SelectButton,
  SuccessPanel,
} from "@/components/form-popup";
import { SkeletonForm } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { haptics } from "@/utils/haptics";

type Mode = "add" | "edit";

type StudentOption = {
  id: number;
  student_id: string;
  username: string;
  full_name: string;
  grade_level: string | null;
  section: string | null;
};

type ViolationOption = {
  id: number;
  violation_name: string;
  amount: number;
};

type OfficerOption = {
  id: number;
  full_name: string;
  role: string;
};

type Fine = {
  fine_reference: string;
  student_id: number;
  student_name: string;
  violation_type_id: number;
  officer_id: number | null;
  issued_at: string;
  remarks: string | null;
  status: string;
};

type Done = {
  title: string;
  lines: string[];
  fineId: number | null;
};

type Menu = "student" | "violation" | "officer" | null;

// ==========================================
// ADD / EDIT FINE POP-UP
// ==========================================

// The Add New Fine and Edit Fine forms as one pop-up. Requests, validation
// and messages are the same as the former screens.
export function FineFormModal({
  visible,
  mode,
  fineId,
  studentId,
  onClose,
  onSaved,
  onViewFine,
}: {
  visible: boolean;
  mode: Mode;
  // Edit: the fine being changed.
  fineId?: number | null;
  // Add: a student already picked, e.g. on the QR Scanner.
  studentId?: number | null;
  onClose: () => void;
  // Runs after a save so the screen underneath can reload.
  onSaved: (fineId: number | null) => void;
  // Add: opens the new fine's details from the success step.
  onViewFine?: (fineId: number) => void;
}) {
  const editing = mode === "edit";

  const runLocked = useActionLock();

  const bodyRef = useRef<ScrollView | null>(null);

  // ----- choices -----
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [violations, setViolations] = useState<ViolationOption[]>([]);
  const [officers, setOfficers] = useState<OfficerOption[]>([]);

  // ----- fine -----
  const [fineReference, setFineReference] = useState("");
  const [fineStatus, setFineStatus] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [issuedAt, setIssuedAt] = useState(todayDate());
  const [remarks, setRemarks] = useState("");

  // ----- pop-up state -----
  const [menu, setMenu] = useState<Menu>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  // Paid, pending and cancelled fines are shown but cannot be changed.
  const editable = !editing || fineStatus.toUpperCase() === "UNPAID";

  const locked = saving || !editable;

  const fail = (message: string) => {
    haptics.warning();
    setNotice("");
    setErrorMessage(message);
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
  };

  // ========================================
  // LOAD
  // ========================================

  const readJson = async (response: Response, fallback: string) => {
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || fallback);
    }

    return data;
  };

  const loadForm = async () => {
    try {
      setLoading(true);
      setLoadError("");
      setErrorMessage("");
      setNotice("");
      setDone(null);
      setMenu(null);

      const [fineData, studentsData, violationsData, officersData] =
        await Promise.all([
          editing
            ? fetch(`${API_BASE}/api/fines/${fineId}`).then((response) =>
                readJson(response, "Failed to load fine."),
              )
            : Promise.resolve(null),
          fetch(`${API_BASE}/api/fines/options/students`).then((response) =>
            readJson(response, "Failed to load students."),
          ),
          fetch(`${API_BASE}/api/fines/options/violations`).then((response) =>
            readJson(response, "Failed to load violation types."),
          ),
          fetch(`${API_BASE}/api/fines/options/officers`).then((response) =>
            readJson(response, "Failed to load officers."),
          ),
        ]);

      const loadedStudents: StudentOption[] = studentsData.students || [];
      const loadedOfficers: OfficerOption[] = officersData.officers || [];

      setStudents(loadedStudents);
      setViolations(violationsData.violations || []);
      setOfficers(loadedOfficers);

      if (editing) {
        const fine: Fine | undefined = fineData?.fine;

        if (!fine) {
          throw new Error("Failed to load fine.");
        }

        setFineReference(fine.fine_reference);
        setFineStatus(String(fine.status || ""));
        setSelectedStudentId(fine.student_id);
        setStudentSearch(fine.student_name);
        setSelectedViolationId(fine.violation_type_id);
        setSelectedOfficerId(fine.officer_id);
        setIssuedAt(dateForInput(fine.issued_at));
        setRemarks(fine.remarks || "");
        return;
      }

      setFineReference("");
      setFineStatus("");
      setSelectedViolationId(null);
      setIssuedAt(todayDate());
      setRemarks("");

      // A student picked on the QR Scanner.
      const picked =
        studentId != null
          ? loadedStudents.find((student) => Number(student.id) === Number(studentId))
          : undefined;

      setSelectedStudentId(picked ? picked.id : null);
      setStudentSearch(picked ? picked.full_name : "");

      if (studentId != null && !picked) {
        setErrorMessage(
          "The student selected from the QR Scanner could not be found. Please search for the student manually.",
        );
      } else if (picked) {
        setNotice(`Student selected from the QR Scanner: ${picked.full_name} • ${picked.student_id}`);
      }

      setSelectedOfficerId(loadedOfficers.length === 1 ? loadedOfficers[0].id : null);
    } catch (error) {
      console.error("Load fine form error:", error);
      // A TypeError means the server could not be reached at all.
      setLoadError(
        error instanceof Error && !(error instanceof TypeError)
          ? error.message
          : editing
            ? "Could not load the fine. Please check the SmartFine server."
            : "Could not load the Add Fine form. Please check the SmartFine server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Every opening starts from the saved fine (edit) or a blank form (add).
  useEffect(() => {
    if (visible) {
      void loadForm();
    }
  }, [visible, editing, fineId, studentId]);

  // ========================================
  // CHOICES
  // ========================================

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  const selectedViolation = useMemo(
    () => violations.find((violation) => violation.id === selectedViolationId) || null,
    [violations, selectedViolationId],
  );

  const selectedOfficer = useMemo(
    () => officers.find((officer) => officer.id === selectedOfficerId) || null,
    [officers, selectedOfficerId],
  );

  const matchingStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return students
      .filter((student) =>
        [student.full_name, student.student_id, student.username, student.grade_level, student.section]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
      .slice(0, 6);
  }, [students, studentSearch]);

  const changeStudentSearch = (text: string) => {
    setStudentSearch(text);
    setSelectedStudentId(null);
    setMenu(text.trim() ? "student" : null);
    setNotice("");
    clearMessages();
  };

  const toggleMenu = (next: Exclude<Menu, null>) => {
    setMenu((current) => (current === next ? null : next));
  };

  // ========================================
  // SAVE
  // ========================================

  const save = () =>
    runLocked(async () => {
      setErrorMessage("");
      setMenu(null);

      if (editing && !editable) {
        fail("Only unpaid fines can be edited.");
        return;
      }

      if (selectedStudentId === null) {
        fail("Please search for and select a student.");
        return;
      }

      if (selectedViolationId === null) {
        fail("Please select a violation type.");
        return;
      }

      if (selectedOfficerId === null) {
        fail("Please select an assigned officer.");
        return;
      }

      if (!isValidDate(issuedAt)) {
        fail("Please enter the violation date using YYYY-MM-DD.");
        return;
      }

      try {
        setSaving(true);

        const token = await AsyncStorage.getItem("token");

        const response = await fetch(
          editing ? `${API_BASE}/api/fines/${fineId}` : `${API_BASE}/api/fines`,
          {
            method: editing ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              studentId: selectedStudentId,
              violationTypeId: selectedViolationId,
              recordedBy: selectedOfficerId,
              remarks: remarks.trim(),
              issuedAt: issuedAt.trim(),
            }),
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          fail(
            data?.message ||
              (editing ? "Failed to update fine." : "Failed to record fine."),
          );
          return;
        }

        haptics.success();

        const savedId = editing ? Number(fineId) : Number(data.fine?.id);
        const reference =
          data.fine?.fineReference || data.fine?.fine_reference || fineReference;
        const studentName =
          data.fine?.studentName || selectedStudent?.full_name || studentSearch.trim();
        const detail = selectedViolation
          ? `${selectedViolation.violation_name} · ${money(selectedViolation.amount)}`
          : "";

        setDone({
          title: editing ? "Fine Updated" : "Fine Recorded",
          lines: [
            editing
              ? reference
                ? `Fine ${reference} was updated successfully.`
                : "Fine updated successfully."
              : reference
                ? `Fine ${reference} was recorded for ${studentName}.`
                : "Fine recorded successfully.",
            ...(detail ? [detail] : []),
          ],
          fineId: Number.isSafeInteger(savedId) && savedId > 0 ? savedId : null,
        });

        onSaved(Number.isSafeInteger(savedId) && savedId > 0 ? savedId : null);
      } catch (error) {
        console.error("Save fine error:", error);
        fail("Could not connect to the SmartFine server.");
      } finally {
        setSaving(false);
      }
    });

  // ========================================
  // UI
  // ========================================

  const footer = done ? (
    <>
      {!editing && (
        <PopupButton
          label="Record Another"
          variant="outline"
          onPress={() => void loadForm()}
        />
      )}
      {!editing && done.fineId && onViewFine ? (
        <PopupButton
          label="View Fine"
          variant="outline"
          onPress={() => onViewFine(done.fineId as number)}
        />
      ) : null}
      <PopupButton label="Done" onPress={onClose} />
    </>
  ) : (
    <>
      <PopupButton label="Cancel" variant="outline" disabled={saving} onPress={onClose} />
      <PopupButton
        label={editing ? "Save Changes" : "Save Fine"}
        busyLabel="Saving..."
        busy={saving}
        disabled={loading || Boolean(loadError) || !editable}
        variant={editing ? "primary" : "green"}
        onPress={() => void save()}
      />
    </>
  );

  const message = !done
    ? errorMessage
      ? (
          <Banner
            tone="error"
            title={editing ? "Unable to Update Fine" : "Unable to Save Fine"}
            message={errorMessage}
          />
        )
      : editing && fineStatus && !editable
        ? (
            <Banner
              tone="warning"
              title="Editing Disabled"
              message={`This fine is ${statusLabel(fineStatus)}. Paid, pending and cancelled fines cannot be edited.`}
            />
          )
        : notice
          ? <Banner tone="info" message={notice} />
          : null
    : null;

  return (
    <FormPopup
      visible={visible}
      busy={saving}
      size="lg"
      title={editing ? "Edit Fine" : "Add New Fine"}
      subtitle={
        editing
          ? fineReference
            ? `Update fine ${fineReference}`
            : "Update an unpaid fine"
          : "Record a new fine for a student"
      }
      icon={require("../../assets/icons/fines.png")}
      bodyRef={bodyRef}
      onClose={onClose}
      notice={message}
      footer={footer}
    >
      {done ? (
        <SuccessPanel title={done.title} lines={done.lines} />
      ) : loading ? (
        <SkeletonForm label={editing ? "Loading the fine" : "Loading the Add Fine form"} fields={5} />
      ) : loadError ? (
        <View>
          <Banner
            tone="error"
            title={editing ? "Unable to Load Fine" : "Unable to Load Form"}
            message={loadError}
          />
          <PopupButton label="Try Again" variant="outline" onPress={() => void loadForm()} />
        </View>
      ) : (
        <>
          <FormRow>
            <FormField
              inRow
              label="Student Name"
              required
              hint={selectedStudent ? `${selectedStudent.student_id}${selectedStudent.grade_level ? ` • ${selectedStudent.grade_level}` : ""}${selectedStudent.section ? ` - ${selectedStudent.section}` : ""}` : "Type a name or Student ID, then pick the student."}
            >
              <FormInput
                value={studentSearch}
                onChangeText={changeStudentSearch}
                onFocus={() => {
                  if (studentSearch.trim() && selectedStudentId === null) {
                    setMenu("student");
                  }
                }}
                placeholder="Type student name or ID"
                autoCorrect={false}
                editable={!locked}
                accessibilityLabel="Student name or ID"
              />

              {menu === "student" && (
                <OptionList
                  options={matchingStudents.map((student) => ({
                    key: student.id,
                    title: student.full_name,
                    subtitle: `${student.student_id}${student.grade_level ? ` • ${student.grade_level}` : ""}${student.section ? ` - ${student.section}` : ""}`,
                  }))}
                  selectedKey={selectedStudentId}
                  emptyText="No matching active students found."
                  onSelect={(key) => {
                    const student = students.find((item) => item.id === key);
                    if (!student) return;
                    setSelectedStudentId(student.id);
                    setStudentSearch(student.full_name);
                    setMenu(null);
                    clearMessages();
                  }}
                />
              )}
            </FormField>

            <FormField inRow label="Date of Violation" required hint="Format: YYYY-MM-DD">
              <FormInput
                value={issuedAt}
                onChangeText={(text) => {
                  setIssuedAt(text);
                  clearMessages();
                }}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                editable={!locked}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField inRow label="Violation Type" required>
              <SelectButton
                value={selectedViolation?.violation_name || ""}
                placeholder="Select violation type"
                open={menu === "violation"}
                onPress={() => toggleMenu("violation")}
                disabled={locked}
                accessibilityLabel="Violation type"
              />

              {menu === "violation" && (
                <OptionList
                  options={violations.map((violation) => ({
                    key: violation.id,
                    title: violation.violation_name,
                    subtitle: money(violation.amount),
                  }))}
                  selectedKey={selectedViolationId}
                  emptyText="No active violation types. Add one in Settings › Fine Types."
                  onSelect={(key) => {
                    setSelectedViolationId(Number(key));
                    setMenu(null);
                    clearMessages();
                  }}
                />
              )}
            </FormField>

            <FormField inRow label="Assigned Officer" required>
              <SelectButton
                value={selectedOfficer?.full_name || ""}
                placeholder="Select officer"
                open={menu === "officer"}
                onPress={() => toggleMenu("officer")}
                disabled={locked}
                accessibilityLabel="Assigned officer"
              />

              {menu === "officer" && (
                <OptionList
                  options={officers.map((officer) => ({
                    key: officer.id,
                    title: officer.full_name,
                    subtitle: roleLabel(officer.role),
                  }))}
                  selectedKey={selectedOfficerId}
                  emptyText="No active officers found."
                  onSelect={(key) => {
                    setSelectedOfficerId(Number(key));
                    setMenu(null);
                    clearMessages();
                  }}
                />
              )}
            </FormField>
          </FormRow>

          <FormRow>
            <FormField inRow label="Amount" hint="Set by the violation type.">
              <ReadOnlyValue
                value={selectedViolation ? money(selectedViolation.amount) : ""}
                placeholder="₱0.00"
              />
            </FormField>

            <FormField inRow label="Notes / Description">
              <FormInput
                value={remarks}
                onChangeText={(text) => {
                  setRemarks(text);
                  clearMessages();
                }}
                placeholder="Enter minor details"
                editable={!locked}
                onSubmitEditing={() => void save()}
              />
            </FormField>
          </FormRow>
        </>
      )}
    </FormPopup>
  );
}

// ==========================================
// HELPERS
// ==========================================

function todayDate() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dateForInput(value: string | null | undefined) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return false;
  }

  const [year, month, day] = value.trim().split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function money(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function roleLabel(role: string) {
  switch (String(role || "").toUpperCase()) {
    case "FINES_OFFICER":
      return "Fines Officer";
    case "ADMIN":
      return "Administrator";
    default:
      return role;
  }
}

function statusLabel(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "paid";
    case "PENDING":
      return "waiting for a payment";
    case "CANCELLED":
      return "cancelled";
    default:
      return String(status || "").toLowerCase();
  }
}
