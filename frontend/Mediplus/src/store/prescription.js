import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// ✅ Upload Prescription (Doctor)
export const uploadPrescription = async (formData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/prescriptions/`, formData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading prescription:", error);
    throw error;
  }
};

// ✅ Get Prescriptions for Patient
export const getPrescriptions = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    throw error;
  }
};

// ✅ Send Prescription to Pharmacy (Patient)
export const sendToPharmacy = async (prescriptionId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/pharmacy/send/${prescriptionId}`,
      {},
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending to pharmacy:", error);
    throw error;
  }
};

// ✅ Get Prescription Status from Pharmacy (Pharmacist)
export const getPharmacyOrders = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pharmacy/orders`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching pharmacy orders:", error);
    throw error;
  }
};

// ✅ Mark Prescription as Ready for Pickup (Pharmacist)
export const markAsReady = async (prescriptionId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/pharmacy/ready/${prescriptionId}`,
      {},
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking as ready:", error);
    throw error;
  }
};
