const cardContentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "question",
    "choices",
    "correctChoiceId",
    "prompt",
    "acceptedAnswer",
    "aliases",
    "caseSensitive",
  ],
  properties: {
    question: { type: ["string", "null"] },
    choices: {
      anyOf: [
        {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "text"],
            properties: {
              id: { type: "string" },
              text: { type: "string" },
            },
          },
        },
        { type: "null" },
      ],
    },
    correctChoiceId: { type: ["string", "null"] },
    prompt: { type: ["string", "null"] },
    acceptedAnswer: { type: ["string", "null"] },
    aliases: {
      anyOf: [
        {
          type: "array",
          items: { type: "string" },
        },
        { type: "null" },
      ],
    },
    caseSensitive: { type: ["boolean", "null"] },
  },
} as const;

export const flashcardResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["cards"],
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "front",
          "back",
          "content",
          "hint",
          "explanation",
          "sourceExcerpt",
          "difficulty",
          "tags",
        ],
        properties: {
          type: {
            type: "string",
            enum: ["plain", "multiple_choice", "typed_answer"],
          },
          front: { type: "string" },
          back: { type: ["string", "null"] },
          content: cardContentJsonSchema,
          hint: { type: ["string", "null"] },
          explanation: { type: ["string", "null"] },
          sourceExcerpt: { type: ["string", "null"] },
          difficulty: {
            anyOf: [
              { type: "string", enum: ["easy", "medium", "hard"] },
              { type: "null" },
            ],
          },
          tags: {
            anyOf: [
              {
                type: "array",
                items: { type: "string" },
              },
              { type: "null" },
            ],
          },
        },
      },
    },
  },
} as const;
