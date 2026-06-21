/**
 * Sample DSA sheet. Problems reference their topic by slug and are ordered by
 * array position within each topic (assigned in seed.ts).
 */

export interface SeedTopic {
  slug: string;
  name: string;
  order: number;
  description: string;
}

export interface SeedProblem {
  topicSlug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subtopic?: string;
  tags?: string[];
  links?: Partial<Record<'youtube' | 'leetcode' | 'codeforces' | 'article', string>>;
}

export const topics: SeedTopic[] = [
  { slug: 'arrays', name: 'Arrays', order: 1, description: 'Core array techniques and patterns.' },
  { slug: 'strings', name: 'Strings', order: 2, description: 'String manipulation and parsing.' },
  { slug: 'two-pointers', name: 'Two Pointers', order: 3, description: 'Opposite/same-direction pointer patterns.' },
  { slug: 'sliding-window', name: 'Sliding Window', order: 4, description: 'Fixed and dynamic windows.' },
  { slug: 'binary-search', name: 'Binary Search', order: 5, description: 'Search on sorted data and on answer space.' },
  { slug: 'linked-list', name: 'Linked List', order: 6, description: 'Singly/doubly linked list operations.' },
  { slug: 'stacks-queues', name: 'Stacks & Queues', order: 7, description: 'LIFO/FIFO structures and monotonic stacks.' },
  { slug: 'trees', name: 'Trees', order: 8, description: 'Binary trees, BSTs, and traversals.' },
  { slug: 'graphs', name: 'Graphs', order: 9, description: 'BFS, DFS, shortest paths, union-find.' },
  { slug: 'dynamic-programming', name: 'Dynamic Programming', order: 10, description: 'Memoization and tabulation.' },
  { slug: 'greedy', name: 'Greedy', order: 11, description: 'Locally optimal choices.' },
  { slug: 'heaps', name: 'Heaps & Priority Queues', order: 12, description: 'Top-K and scheduling problems.' },
];

const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const problems: SeedProblem[] = [
  // Arrays
  { topicSlug: 'arrays', title: 'Two Sum', difficulty: 'Easy', subtopic: 'Hashing', tags: ['hash-map'], links: { leetcode: lc('two-sum'), youtube: 'https://youtu.be/KLlXCFG5TnA' } },
  { topicSlug: 'arrays', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', subtopic: 'Kadane', tags: ['greedy'], links: { leetcode: lc('best-time-to-buy-and-sell-stock') } },
  { topicSlug: 'arrays', title: 'Maximum Subarray', difficulty: 'Medium', subtopic: 'Kadane', tags: ['dp'], links: { leetcode: lc('maximum-subarray') } },
  { topicSlug: 'arrays', title: 'Product of Array Except Self', difficulty: 'Medium', subtopic: 'Prefix', tags: ['prefix-sum'], links: { leetcode: lc('product-of-array-except-self') } },
  { topicSlug: 'arrays', title: 'Trapping Rain Water', difficulty: 'Hard', subtopic: 'Two Pointers', tags: ['two-pointers'], links: { leetcode: lc('trapping-rain-water') } },

  // Strings
  { topicSlug: 'strings', title: 'Valid Anagram', difficulty: 'Easy', subtopic: 'Hashing', tags: ['hash-map'], links: { leetcode: lc('valid-anagram') } },
  { topicSlug: 'strings', title: 'Valid Palindrome', difficulty: 'Easy', subtopic: 'Two Pointers', tags: ['two-pointers'], links: { leetcode: lc('valid-palindrome') } },
  { topicSlug: 'strings', title: 'Longest Palindromic Substring', difficulty: 'Medium', subtopic: 'Expand Center', tags: ['dp'], links: { leetcode: lc('longest-palindromic-substring') } },
  { topicSlug: 'strings', title: 'Group Anagrams', difficulty: 'Medium', subtopic: 'Hashing', tags: ['hash-map'], links: { leetcode: lc('group-anagrams') } },

  // Two Pointers
  { topicSlug: 'two-pointers', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'Medium', subtopic: 'Opposite Ends', tags: ['two-pointers'], links: { leetcode: lc('two-sum-ii-input-array-is-sorted') } },
  { topicSlug: 'two-pointers', title: '3Sum', difficulty: 'Medium', subtopic: 'Sort + Scan', tags: ['sorting'], links: { leetcode: lc('3sum') } },
  { topicSlug: 'two-pointers', title: 'Container With Most Water', difficulty: 'Medium', subtopic: 'Opposite Ends', tags: ['greedy'], links: { leetcode: lc('container-with-most-water') } },

  // Sliding Window
  { topicSlug: 'sliding-window', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', subtopic: 'Dynamic Window', tags: ['hash-set'], links: { leetcode: lc('longest-substring-without-repeating-characters') } },
  { topicSlug: 'sliding-window', title: 'Minimum Window Substring', difficulty: 'Hard', subtopic: 'Dynamic Window', tags: ['hash-map'], links: { leetcode: lc('minimum-window-substring') } },
  { topicSlug: 'sliding-window', title: 'Permutation in String', difficulty: 'Medium', subtopic: 'Fixed Window', tags: ['hash-map'], links: { leetcode: lc('permutation-in-string') } },

  // Binary Search
  { topicSlug: 'binary-search', title: 'Binary Search', difficulty: 'Easy', subtopic: 'Classic', tags: [], links: { leetcode: lc('binary-search') } },
  { topicSlug: 'binary-search', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', subtopic: 'Rotated', tags: [], links: { leetcode: lc('search-in-rotated-sorted-array') } },
  { topicSlug: 'binary-search', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', subtopic: 'Partition', tags: [], links: { leetcode: lc('median-of-two-sorted-arrays') } },
  { topicSlug: 'binary-search', title: 'Koko Eating Bananas', difficulty: 'Medium', subtopic: 'Search on Answer', tags: [], links: { leetcode: lc('koko-eating-bananas') } },

  // Linked List
  { topicSlug: 'linked-list', title: 'Reverse Linked List', difficulty: 'Easy', subtopic: 'Pointers', tags: [], links: { leetcode: lc('reverse-linked-list') } },
  { topicSlug: 'linked-list', title: 'Merge Two Sorted Lists', difficulty: 'Easy', subtopic: 'Merge', tags: [], links: { leetcode: lc('merge-two-sorted-lists') } },
  { topicSlug: 'linked-list', title: 'Linked List Cycle', difficulty: 'Easy', subtopic: "Floyd's", tags: ['two-pointers'], links: { leetcode: lc('linked-list-cycle') } },
  { topicSlug: 'linked-list', title: 'Reorder List', difficulty: 'Medium', subtopic: 'Pointers', tags: [], links: { leetcode: lc('reorder-list') } },

  // Stacks & Queues
  { topicSlug: 'stacks-queues', title: 'Valid Parentheses', difficulty: 'Easy', subtopic: 'Stack', tags: [], links: { leetcode: lc('valid-parentheses') } },
  { topicSlug: 'stacks-queues', title: 'Min Stack', difficulty: 'Medium', subtopic: 'Design', tags: [], links: { leetcode: lc('min-stack') } },
  { topicSlug: 'stacks-queues', title: 'Daily Temperatures', difficulty: 'Medium', subtopic: 'Monotonic Stack', tags: ['monotonic'], links: { leetcode: lc('daily-temperatures') } },
  { topicSlug: 'stacks-queues', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', subtopic: 'Monotonic Stack', tags: ['monotonic'], links: { leetcode: lc('largest-rectangle-in-histogram') } },

  // Trees
  { topicSlug: 'trees', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', subtopic: 'DFS', tags: [], links: { leetcode: lc('maximum-depth-of-binary-tree') } },
  { topicSlug: 'trees', title: 'Invert Binary Tree', difficulty: 'Easy', subtopic: 'DFS', tags: [], links: { leetcode: lc('invert-binary-tree') } },
  { topicSlug: 'trees', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', subtopic: 'BFS', tags: ['bfs'], links: { leetcode: lc('binary-tree-level-order-traversal') } },
  { topicSlug: 'trees', title: 'Validate Binary Search Tree', difficulty: 'Medium', subtopic: 'BST', tags: [], links: { leetcode: lc('validate-binary-search-tree') } },
  { topicSlug: 'trees', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', subtopic: 'Design', tags: [], links: { leetcode: lc('serialize-and-deserialize-binary-tree') } },

  // Graphs
  { topicSlug: 'graphs', title: 'Number of Islands', difficulty: 'Medium', subtopic: 'Flood Fill', tags: ['bfs', 'dfs'], links: { leetcode: lc('number-of-islands') } },
  { topicSlug: 'graphs', title: 'Clone Graph', difficulty: 'Medium', subtopic: 'DFS', tags: ['hash-map'], links: { leetcode: lc('clone-graph') } },
  { topicSlug: 'graphs', title: 'Course Schedule', difficulty: 'Medium', subtopic: 'Topo Sort', tags: ['topological'], links: { leetcode: lc('course-schedule') } },
  { topicSlug: 'graphs', title: 'Word Ladder', difficulty: 'Hard', subtopic: 'BFS', tags: ['bfs'], links: { leetcode: lc('word-ladder') } },

  // Dynamic Programming
  { topicSlug: 'dynamic-programming', title: 'Climbing Stairs', difficulty: 'Easy', subtopic: '1D DP', tags: [], links: { leetcode: lc('climbing-stairs') } },
  { topicSlug: 'dynamic-programming', title: 'House Robber', difficulty: 'Medium', subtopic: '1D DP', tags: [], links: { leetcode: lc('house-robber') } },
  { topicSlug: 'dynamic-programming', title: 'Coin Change', difficulty: 'Medium', subtopic: 'Unbounded Knapsack', tags: [], links: { leetcode: lc('coin-change') } },
  { topicSlug: 'dynamic-programming', title: 'Longest Increasing Subsequence', difficulty: 'Medium', subtopic: 'LIS', tags: [], links: { leetcode: lc('longest-increasing-subsequence') } },
  { topicSlug: 'dynamic-programming', title: 'Edit Distance', difficulty: 'Hard', subtopic: '2D DP', tags: [], links: { leetcode: lc('edit-distance') } },

  // Greedy
  { topicSlug: 'greedy', title: 'Jump Game', difficulty: 'Medium', subtopic: 'Reachability', tags: [], links: { leetcode: lc('jump-game') } },
  { topicSlug: 'greedy', title: 'Gas Station', difficulty: 'Medium', subtopic: 'Prefix', tags: [], links: { leetcode: lc('gas-station') } },
  { topicSlug: 'greedy', title: 'Merge Intervals', difficulty: 'Medium', subtopic: 'Intervals', tags: ['sorting'], links: { leetcode: lc('merge-intervals') } },

  // Heaps
  { topicSlug: 'heaps', title: 'Kth Largest Element in an Array', difficulty: 'Medium', subtopic: 'Top-K', tags: ['heap'], links: { leetcode: lc('kth-largest-element-in-an-array') } },
  { topicSlug: 'heaps', title: 'Top K Frequent Elements', difficulty: 'Medium', subtopic: 'Top-K', tags: ['heap', 'hash-map'], links: { leetcode: lc('top-k-frequent-elements') } },
  { topicSlug: 'heaps', title: 'Find Median from Data Stream', difficulty: 'Hard', subtopic: 'Two Heaps', tags: ['heap', 'design'], links: { leetcode: lc('find-median-from-data-stream') } },
];
