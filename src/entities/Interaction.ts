// // {
// //   "name": "Interaction",
// //   "type": "object",
// //   "properties": {
// //     "customer_id": {
// //       "type": "string",
// //       "description": "ID of the customer"
// //     },
// //     "agent_id": {
// //       "type": "string",
// //       "description": "ID of the agent"
// //     },
// //     "type": {
// //       "type": "string",
// //       "enum": ["Call", "Email", "Chat", "SMS"],
// //       "description": "Type of interaction"
// //     },
// //     "direction": {
// //       "type": "string",
// //       "enum": ["Inbound", "Outbound"],
// //       "description": "Direction of interaction"
// //     },
// //     "status": {
// //       "type": "string",
// //       "enum": ["active", "completed", "missed"],
// //       "default": "active",
// //       "description": "Interaction status"
// //     },
// //     "duration": {
// //       "type": "number",
// //       "description": "Duration in seconds"
// //     },
// //     "summary": {
// //       "type": "string",
// //       "description": "Summary of the interaction"
// //     },
// //     "notes": {
// //       "type": "string",
// //       "description": "Additional notes"
// //     },
// //     "phone_number": {
// //       "type": "string",
// //       "description": "Phone number for calls"
// //     },
// //     "disposition": {
// //       "type": "string",
// //       "enum": ["Completed", "No Answer", "Busy", "Voicemail"],
// //       "description": "Call disposition"
// //     }
// //   },
// //   "required": ["type", "direction"]
// // }

// const Interaction = {
//   list: async (sort = "", limit = 10) => {
//     const mockData = [
//       {
//         id: "int-001",
//         customer_id: "1",
//         agent_id: "a101",
//         type: "Call",
//         direction: "Inbound",
//         status: "active",
//         duration: 120,
//         summary: "Inquiry about pricing",
//         notes: "Customer might convert soon",
//         phone_number: "+91-9876543210",
//         disposition: "Completed",
//         created_date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hrs ago
//       },
//       {
//         id: "int-002",
//         customer_id: "2",
//         agent_id: "a102",
//         type: "Email",
//         direction: "Outbound",
//         status: "completed",
//         duration: 0,
//         summary: "Follow-up on previous request",
//         notes: "Sent demo PDF",
//         phone_number: "",
//         disposition: "Completed",
//         created_date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hrs ago
//       },
//       {
//         id: "int-003",
//         customer_id: "3",
//         agent_id: "a103",
//         type: "Chat",
//         direction: "Inbound",
//         status: "missed",
//         duration: 0,
//         summary: "",
//         notes: "Customer left before agent joined",
//         phone_number: "",
//         disposition: "No Answer",
//         created_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
//       },
//     ];

//     // Simple sorting based on created_date
//     const sorted =
//       sort === "-created_date"
//         ? mockData.sort(
//             (a, b) => b.created_date.getTime() - a.created_date.getTime()
//           )
//         : mockData;

//     return sorted.slice(0, limit);
//   },

//   create: async (interaction) => {
//     console.log("Saving interaction to mock:", interaction);
//     // In real backend you'd save to DB and return response
//     return {
//       ...interaction,
//       id: `int-${Math.floor(Math.random() * 1000)}`,
//       created_date: new Date(),
//     };
//   },
// };

// export default Interaction;
