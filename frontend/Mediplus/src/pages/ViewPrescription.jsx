import { useEffect, useState } from "react";
import { getPrescriptions } from "../api/prescription";
import useAuthStore from "../store/authStore";

const ViewPrescriptions = () => {
  const { token } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getPrescriptions(token);
      setPrescriptions(res);
    };
    fetchData();
  }, [token]);

  return (
    <div>
      <h2>Your Prescriptions</h2>
      {prescriptions.map((p) => (
        <div key={p.id}>
          <p>Doctor ID: {p.doctor_id}</p>
          <p>Patient: {p.patient_name} (ID: {p.patient_user_id})</p>
          <a href={`http://127.0.0.1:8000/${p.file_path}`} target="_blank" rel="noopener noreferrer">View PDF</a>
        </div>
      ))}
    </div>
  );
};

export default ViewPrescriptions;
