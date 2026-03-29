export default function PatientSelector({ patients, selectedPatientId, onChange }) {
  return (
    <label className="participant-picker">
      <span className="participant-picker-label">Participant</span>
      <select value={selectedPatientId || ""} onChange={(event) => onChange(event.target.value)}>
        {patients.map((patient) => (
          <option key={patient.patient_id} value={patient.patient_id}>
            {patient.patient_id} · {patient.profile_label}
          </option>
        ))}
      </select>
    </label>
  );
}
