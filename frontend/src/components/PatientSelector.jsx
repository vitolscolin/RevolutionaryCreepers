export default function PatientSelector({ patients, selectedPatientId, onChange }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Participant View</p>
          <h2>Select a participant twin</h2>
        </div>
      </div>

      <select
        className="patient-select"
        value={selectedPatientId || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {patients.map((patient) => (
          <option key={patient.patient_id} value={patient.patient_id}>
            {patient.patient_id} · {patient.profile_label}
          </option>
        ))}
      </select>
    </section>
  );
}
