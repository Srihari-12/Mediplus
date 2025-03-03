import { useEffect, useState } from "react";
import { getPharmacyOrders, markAsReady } from "../api/prescription";
import useAuthStore from "../store/authStore";

const PharmacyDashboard = () => {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getPharmacyOrders(token);
        setOrders(data);
      } catch (error) {
        console.error("Error fetching pharmacy orders:", error);
      }
    };
    fetchOrders();
  }, [token]);

  const handleMarkReady = async (prescriptionId) => {
    try {
      await markAsReady(prescriptionId, token);
      alert("Prescription marked as ready!");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div>
      <h2>Pharmacy Orders</h2>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Prescription ID: {order.prescription_id}</p>
          <p>Patient ID: {order.patient_user_id}</p>
          <p>Status: {order.status}</p>
          {order.status === "pending" && (
            <button onClick={() => handleMarkReady(order.id)}>Mark as Ready</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default PharmacyDashboard;
