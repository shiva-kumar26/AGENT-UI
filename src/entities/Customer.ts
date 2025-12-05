// // {
// //   "name": "Customer",
// //   "type": "object",
// //   "properties": {
// //     "first_name": {
// //       "type": "string",
// //       "description": "Customer's first name"
// //     },
// //     "last_name": {
// //       "type": "string",
// //       "description": "Customer's last name"
// //     },
// //     "email": {
// //       "type": "string",
// //       "format": "email",
// //       "description": "Customer's email address"
// //     },
// //     "phone": {
// //       "type": "string",
// //       "description": "Customer's phone number"
// //     },
// //     "company": {
// //       "type": "string",
// //       "description": "Customer's company"
// //     },
// //     "job_title": {
// //       "type": "string",
// //       "description": "Customer's job title"
// //     },
// //     "status": {
// //       "type": "string",
// //       "enum": [
// //         "Active",
// //         "Inactive",
// //         "Prospect"
// //       ],
// //       "default": "Active",
// //       "description": "Customer status"
// //     },
// //     "preferred_contact": {
// //       "type": "string",
// //       "enum": [
// //         "Phone",
// //         "Email",
// //         "SMS"
// //       ],
// //       "default": "Phone",
// //       "description": "Preferred contact method"
// //     },
// //     "notes": {
// //       "type": "string",
// //       "description": "Notes about the customer"
// //     },
// //     "street_address": {
// //       "type": "string",
// //       "description": "Street address"
// //     },
// //     "city": {
// //       "type": "string",
// //       "description": "City"
// //     },
// //     "state": {
// //       "type": "string",
// //       "description": "State"
// //     },
// //     "zip_code": {
// //       "type": "string",
// //       "description": "ZIP code"
// //     }
// //   },
// //   "required": [
// //     "first_name",
// //     "last_name"
// //   ]
// // }

// type CustomerType = {
//   id: string;
//   first_name: string;
//   last_name: string;
//   email?: string;
//   phone?: string;
//   company?: string;
//   job_title?: string;
//   status: "Active" | "Inactive" | "Prospect";
//   preferred_contact: "Phone" | "Email" | "SMS";
//   notes?: string;
//   street_address?: string;
//   city?: string;
//   state?: string;
//   zip_code?: string;
//   created_date?: Date;
// };

// let customers: CustomerType[] = [
//   {
//     id: "1",
//     first_name: "Alice",
//     last_name: "Sharma",
//     email: "alice.sharma@example.com",
//     phone: "+91-9876543210",
//     company: "TechCorp",
//     job_title: "Software Engineer",
//     status: "Active",
//     preferred_contact: "Email",
//     notes: "Interested in product demo.",
//     street_address: "123 MG Road",
//     city: "Bangalore",
//     state: "Karnataka",
//     zip_code: "560001",
//     created_date: new Date("2024-12-01"),
//   },
//   {
//     id: "2",
//     first_name: "Ravi",
//     last_name: "Verma",
//     email: "ravi.verma@example.com",
//     phone: "+91-9123456789",
//     company: "Fintech Ltd",
//     job_title: "Account Manager",
//     status: "Prospect",
//     preferred_contact: "Phone",
//     notes: "Requested pricing details.",
//     street_address: "45 Residency Rd",
//     city: "Mumbai",
//     state: "Maharashtra",
//     zip_code: "400001",
//     created_date: new Date("2024-12-10"),
//   },
//   {
//     id: "3",
//     first_name: "John",
//     last_name: "Doe",
//     email: "john.doe@example.com",
//     phone: "+1-555-123-4567",
//     company: "ExampleCorp",
//     job_title: "Engineer",
//     status: "Active",
//     preferred_contact: "Email",
//     notes: "VIP customer",
//     street_address: "123 Main St",
//     city: "New York",
//     state: "NY",
//     zip_code: "10001",
//     created_date: new Date("2024-11-20"),
//   },
//   {
//     id: "6",
//     first_name: "Sophia",
//     last_name: "Garcia",
//     email: "sophia.garcia@example.com",
//     phone: "+1-555-555-7788",
//     company: "EduWave",
//     job_title: "Curriculum Developer",
//     status: "Inactive",
//     preferred_contact: "Phone",
//     notes: "Prefers communication after 5 PM",
//     street_address: "908 Maple Dr",
//     city: "Miami",
//     state: "FL",
//     zip_code: "33101",
//     created_date: new Date("2024-06-30"),
//   },
//   {
//     id: "7",
//     first_name: "David",
//     last_name: "Lee",
//     email: "david.lee@example.com",
//     phone: "+1-555-666-9999",
//     company: "BuildRight",
//     job_title: "Architect",
//     status: "Inactive",
//     preferred_contact: "Email",
//     notes: "Needs CAD integration",
//     street_address: "122 River Rd",
//     city: "Denver",
//     state: "CO",
//     zip_code: "80203",
//     created_date: new Date("2024-05-10"),
//   },
//   {
//     id: "8",
//     first_name: "Olivia",
//     last_name: "Martinez",
//     email: "olivia.martinez@example.com",
//     phone: "+1-555-777-6655",
//     company: "Artify",
//     job_title: "Creative Director",
//     status: "Active",
//     preferred_contact: "Phone",
//     notes: "Referred by John Doe",
//     street_address: "567 Birch Ln",
//     city: "Los Angeles",
//     state: "CA",
//     zip_code: "90001",
//     created_date: new Date("2024-10-02"),
//   },
//   {
//     id: "9",
//     first_name: "James",
//     last_name: "Taylor",
//     email: "james.taylor@example.com",
//     phone: "+1-555-888-3322",
//     company: "FinEdge",
//     job_title: "Analyst",
//     status: "Inactive",
//     preferred_contact: "Email",
//     notes: "Uses legacy product",
//     street_address: "890 Spruce Blvd",
//     city: "Atlanta",
//     state: "GA",
//     zip_code: "30301",
//     created_date: new Date("2024-09-10"),
//   },
//   {
//     id: "10",
//     first_name: "Ava",
//     last_name: "Nguyen",
//     email: "ava.nguyen@example.com",
//     phone: "+1-555-999-4433",
//     company: "NextGenAI",
//     job_title: "Data Scientist",
//     status: "Active",
//     preferred_contact: "Phone",
//     notes: "Attended last webinar",
//     street_address: "310 Redwood St",
//     city: "Boston",
//     state: "MA",
//     zip_code: "02108",
//     created_date: new Date("2024-12-01"),
//   },
// ];

// const Customer = {
//   list: async (
//     sortOrder: string = "",
//     limit?: number
//   ): Promise<CustomerType[]> => {
//     let result = [...customers];

//     if (sortOrder === "-created_date") {
//       result.sort((a, b) => {
//         return (
//           (b.created_date?.getTime() || 0) - (a.created_date?.getTime() || 0)
//         );
//       });
//     }

//     if (limit) result = result.slice(0, limit);

//     return result;
//   },

//   create: async (
//     data: Omit<CustomerType, "id" | "created_date">
//   ): Promise<CustomerType> => {
//     const newCustomer: CustomerType = {
//       ...data,
//       id: Date.now().toString(),
//       created_date: new Date(),
//     };
//     customers.unshift(newCustomer); // newest first
//     return newCustomer;
//   },

//   update: async (
//     id: string,
//     data: Partial<CustomerType>
//   ): Promise<CustomerType | null> => {
//     const index = customers.findIndex((c) => c.id === id);
//     if (index === -1) return null;

//     customers[index] = { ...customers[index], ...data };
//     return customers[index];
//   },
// };

// export default Customer;
