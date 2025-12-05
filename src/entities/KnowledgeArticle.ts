// // {
// //   "name": "KnowledgeArticle",
// //   "type": "object",
// //   "properties": {
// //     "title": {
// //       "type": "string",
// //       "description": "Article title"
// //     },
// //     "content": {
// //       "type": "string",
// //       "description": "Article content"
// //     },
// //     "category": {
// //       "type": "string",
// //       "enum": [
// //         "Troubleshooting",
// //         "Product Info",
// //         "Policies",
// //         "Procedures",
// //         "FAQ"
// //       ],
// //       "default": "FAQ",
// //       "description": "Article category"
// //     },
// //     "tags": {
// //       "type": "array",
// //       "items": {
// //         "type": "string"
// //       },
// //       "description": "Article tags"
// //     },
// //     "status": {
// //       "type": "string",
// //       "enum": ["Published", "Draft"],
// //       "default": "Draft",
// //       "description": "Article status"
// //     },
// //     "views": {
// //       "type": "number",
// //       "default": 0,
// //       "description": "Number of views"
// //     },
// //     "helpful_votes": {
// //       "type": "number",
// //       "default": 0,
// //       "description": "Number of helpful votes"
// //     }
// //   },
// //   "required": ["title", "content"]
// // }

// export type KnowledgeArticleType = {
//   id: string;
//   title: string;
//   content: string;
//   category:
//     | "Troubleshooting"
//     | "Product Info"
//     | "Policies"
//     | "Procedures"
//     | "FAQ";
//   tags: string[];
//   status: "Published" | "Draft";
//   views: number;
//   helpful_votes: number;
//   created_date: Date;
// };

// const KnowledgeArticle = {
//   list: async (
//     sort: string = "-created_date",
//     limit = 10
//   ): Promise<KnowledgeArticleType[]> => {
//     const mockArticles: KnowledgeArticleType[] = [
//       {
//         id: "art-001",
//         title: "How to Reset Your Password",
//         content:
//           "To reset your password, go to Settings > Account > Reset Password...",
//         category: "Troubleshooting",
//         tags: ["password", "account", "reset"],
//         status: "Published",
//         views: 150,
//         helpful_votes: 45,
//         created_date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hrs ago
//       },
//       {
//         id: "art-002",
//         title: "Product Warranty Details",
//         content:
//           "Our products come with a 1-year warranty covering manufacturing defects...",
//         category: "Product Info",
//         tags: ["warranty", "product", "policy"],
//         status: "Published",
//         views: 90,
//         helpful_votes: 20,
//         created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
//       },
//       {
//         id: "art-003",
//         title: "Leave Policy",
//         content: "Employees are entitled to 24 days of paid leave per year...",
//         category: "Policies",
//         tags: ["leave", "hr", "policy"],
//         status: "Draft",
//         views: 30,
//         helpful_votes: 5,
//         created_date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hrs ago
//       },
//       {
//         id: "art-004",
//         title: "Leave Policy",
//         content: "Employees are entitled to 24 days of paid leave per year...",
//         category: "Policies",
//         tags: ["leave", "hr", "policy"],
//         status: "Draft",
//         views: 30,
//         helpful_votes: 5,
//         created_date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hrs ago
//       },
//       {
//         id: "art-005",
//         title: "Leave Policy",
//         content: "Employees are entitled to 24 days of paid leave per year...",
//         category: "Policies",
//         tags: ["leave", "hr", "policy"],
//         status: "Draft",
//         views: 30,
//         helpful_votes: 5,
//         created_date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hrs ago
//       },
//     ];

//     const sorted =
//       sort === "-created_date"
//         ? mockArticles.sort(
//             (a, b) => b.created_date.getTime() - a.created_date.getTime()
//           )
//         : mockArticles;

//     return sorted.slice(0, limit);
//   },
// };

// export default KnowledgeArticle;
