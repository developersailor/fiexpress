export const playgroundConfig = {
  settings: {
    'editor.theme': 'dark',
    'editor.fontSize': 14,
    'editor.fontFamily': 'Monaco, Consolas, "Courier New", monospace',
    'editor.reuseHeaders': true,
    'tracing.hideTracingResponse': false,
    'queryPlan.hideQueryPlanResponse': false,
    'editor.cursorShape': 'line',
    'editor.lineWrap': 'on',
    'prettify.printWidth': 80,
    'prettify.tabWidth': 2,
    'prettify.useTabs': false,
    'request.credentials': 'include'
  },
  tabs: [
    {
      endpoint: '/graphql',
      query: `# Welcome to GraphQL Playground
# 
# GraphQL Playground is an in-browser tool for writing, validating, and
# testing GraphQL queries, mutations, and subscriptions.
#
# Type queries into this side of the screen, and you'll see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#  Merge Fragments: Shift-Ctrl-M (or press the merge button above)
#
#  Run Query:       Ctrl-Enter (or press the play button above)
#
#  Auto Complete:    Ctrl-Space (or just start typing)
#

query GetUsers {
  users {
    id
    email
    name
    avatar
    createdAt
  }
}`,
      variables: {},
      responses: []
    }
  ]
};

export default playgroundConfig;