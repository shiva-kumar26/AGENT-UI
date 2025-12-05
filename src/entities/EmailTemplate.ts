// // {
// //   "name": "EmailTemplate",
// //   "type": "object",
// //   "properties": {
// //     "name": {
// //       "type": "string",
// //       "description": "Template name"
// //     },
// //     "subject": {
// //       "type": "string",
// //       "description": "Email subject"
// //     },
// //     "content": {
// //       "type": "string",
// //       "description": "Email content/body"
// //     },
// //     "category": {
// //       "type": "string",
// //       "enum": ["Welcome", "Follow-up", "Issue Resolution", "General"],
// //       "default": "General",
// //       "description": "Template category"
// //     }
// //   },
// //   "required": ["name", "subject", "content"]
// // }
// // This mock simulates a backend with a `list` method
// const EmailTemplate = {
//   list: async () => {
//     return [
//       {
//         id: "template-001",
//         name: "Welcome Email",
//         subject: "Welcome to Our Service!",
//         content:
//           "Hi {{first_name}},\n\nThank you for joining us. We’re glad to have you onboard!",
//         category: "Welcome",
//       },
//       {
//         id: "template-002",
//         name: "Follow-up Email",
//         subject: "Just checking in...",
//         content:
//           "Hi {{first_name}},\n\nWe wanted to see how things are going. Let us know if you need help.",
//         category: "Follow-up",
//       },
//       {
//         id: "template-003",
//         name: "Issue Resolved",
//         subject: "Your issue has been resolved",
//         content:
//           "Hi {{first_name}},\n\nWe’re happy to inform you that your issue has been resolved. Please confirm.",
//         category: "Issue Resolution",
//       },
//       {
//         id: "template-004",
//         name: "General Update",
//         subject: "Latest News and Updates",
//         content:
//           "Hi {{first_name}},\n\nHere's what's new this month at our company.",
//         category: "General",
//       },
//     ];
//   },
// };

// export default EmailTemplate;
