/**
 * DSA sheet sourced from GeeksforGeeks Top 100 DSA Interview Questions (topic-wise).
 * Problems reference their topic by slug; order within a topic is determined by array position.
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
  { slug: 'arrays',            name: 'Arrays',                        order: 1,  description: 'Core array techniques: prefix sums, Kadane, two-pointer, intervals.' },
  { slug: 'matrix',            name: 'Matrix',                        order: 2,  description: '2-D grid traversal, transformations, and backtracking.' },
  { slug: 'strings',           name: 'Strings',                       order: 3,  description: 'Sliding window, hashing, and palindrome patterns on strings.' },
  { slug: 'searching-sorting', name: 'Searching & Sorting',           order: 4,  description: 'Binary search on sorted data and on the answer space; merge/count inversions.' },
  { slug: 'hashing',           name: 'Hashing',                       order: 5,  description: 'Hash maps and sets for O(1) look-up, frequency, and XOR tricks.' },
  { slug: 'linked-list',       name: 'Linked List',                   order: 6,  description: 'Pointer manipulation, cycle detection, merging, and cloning.' },
  { slug: 'stacks-queues',     name: 'Stack, Queue & Deque',          order: 7,  description: 'Monotonic stacks, deque sliding window, expression evaluation.' },
  { slug: 'trees',             name: 'Trees',                         order: 8,  description: 'Binary trees, BSTs, Trie: DFS, BFS, serialization, construction.' },
  { slug: 'heaps',             name: 'Heaps',                         order: 9,  description: 'Min/max heaps for Top-K, scheduling, and streaming medians.' },
  { slug: 'graphs',            name: 'Graphs',                        order: 10, description: 'BFS, DFS, topo sort, cycle detection, SCC, flood fill.' },
  { slug: 'dp-greedy',         name: 'Dynamic Programming & Greedy',  order: 11, description: 'Classic DP (knapsack, LIS, LCS) and greedy interval/rope problems.' },
  { slug: 'bit-manipulation',  name: 'Bit Manipulation',              order: 12, description: 'Bit tricks: XOR, popcount, subset enumeration.' },
];

const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const problems: SeedProblem[] = [
  // ─── Arrays (9) ──────────────────────────────────────────────────────────────
  {
    topicSlug: 'arrays', title: 'Pair with the Given Sum', difficulty: 'Easy',
    subtopic: 'Hashing', tags: ['hash-map', 'two-pointer'],
    links: { leetcode: lc('two-sum') },
  },
  {
    topicSlug: 'arrays', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy',
    subtopic: 'Greedy', tags: ['greedy'],
    links: { leetcode: lc('best-time-to-buy-and-sell-stock') },
  },
  {
    topicSlug: 'arrays', title: 'Product of Array Except Self', difficulty: 'Medium',
    subtopic: 'Prefix Product', tags: ['prefix-sum'],
    links: { leetcode: lc('product-of-array-except-self') },
  },
  {
    topicSlug: 'arrays', title: 'Maximum Subarray', difficulty: 'Medium',
    subtopic: "Kadane's Algorithm", tags: ['dp', 'greedy'],
    links: { leetcode: lc('maximum-subarray') },
  },
  {
    topicSlug: 'arrays', title: 'Container With Most Water', difficulty: 'Medium',
    subtopic: 'Two Pointers', tags: ['two-pointer', 'greedy'],
    links: { leetcode: lc('container-with-most-water') },
  },
  {
    topicSlug: 'arrays', title: 'Factorial of a Large Number', difficulty: 'Easy',
    subtopic: 'Big Integer', tags: ['math'],
    links: { article: 'https://www.geeksforgeeks.org/factorial-large-number/' },
  },
  {
    topicSlug: 'arrays', title: 'Trapping Rain Water', difficulty: 'Hard',
    subtopic: 'Two Pointers', tags: ['two-pointer', 'prefix-sum'],
    links: { leetcode: lc('trapping-rain-water') },
  },
  {
    topicSlug: 'arrays', title: 'Insert Interval', difficulty: 'Medium',
    subtopic: 'Intervals', tags: ['sorting', 'intervals'],
    links: { leetcode: lc('insert-interval') },
  },
  {
    topicSlug: 'arrays', title: 'Merge Intervals', difficulty: 'Medium',
    subtopic: 'Intervals', tags: ['sorting', 'intervals'],
    links: { leetcode: lc('merge-intervals') },
  },

  // ─── Matrix (3) ──────────────────────────────────────────────────────────────
  {
    topicSlug: 'matrix', title: 'Spiral Matrix', difficulty: 'Medium',
    subtopic: 'Simulation', tags: ['simulation'],
    links: { leetcode: lc('spiral-matrix') },
  },
  {
    topicSlug: 'matrix', title: 'Transpose of a Matrix', difficulty: 'Easy',
    subtopic: 'In-place', tags: ['simulation'],
    links: { leetcode: lc('transpose-matrix') },
  },
  {
    topicSlug: 'matrix', title: 'Word Search', difficulty: 'Medium',
    subtopic: 'Backtracking', tags: ['backtracking', 'dfs'],
    links: { leetcode: lc('word-search') },
  },

  // ─── Strings (7) ─────────────────────────────────────────────────────────────
  {
    topicSlug: 'strings', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    subtopic: 'Sliding Window', tags: ['sliding-window', 'hash-set'],
    links: { leetcode: lc('longest-substring-without-repeating-characters') },
  },
  {
    topicSlug: 'strings', title: 'Longest Repeating Character Replacement', difficulty: 'Medium',
    subtopic: 'Sliding Window', tags: ['sliding-window'],
    links: { leetcode: lc('longest-repeating-character-replacement') },
  },
  {
    topicSlug: 'strings', title: 'Smallest Window Containing All Characters', difficulty: 'Hard',
    subtopic: 'Sliding Window', tags: ['sliding-window', 'hash-map'],
    links: { leetcode: lc('minimum-window-substring') },
  },
  {
    topicSlug: 'strings', title: 'Print All Anagrams Together', difficulty: 'Medium',
    subtopic: 'Hashing', tags: ['hash-map', 'sorting'],
    links: { leetcode: lc('group-anagrams') },
  },
  {
    topicSlug: 'strings', title: 'Sentence Palindrome', difficulty: 'Easy',
    subtopic: 'Two Pointers', tags: ['two-pointer'],
    links: { article: 'https://www.geeksforgeeks.org/sentence-palindrome-palindrome-removing-spaces-dots-etc/' },
  },
  {
    topicSlug: 'strings', title: 'Longest Palindromic Substring', difficulty: 'Medium',
    subtopic: 'Expand Around Center', tags: ['dp'],
    links: { leetcode: lc('longest-palindromic-substring') },
  },
  {
    topicSlug: 'strings', title: 'Palindromic Substrings', difficulty: 'Medium',
    subtopic: 'Expand Around Center', tags: ['dp'],
    links: { leetcode: lc('palindromic-substrings') },
  },

  // ─── Searching & Sorting (9) ─────────────────────────────────────────────────
  {
    topicSlug: 'searching-sorting', title: 'Search in Rotated Sorted Array', difficulty: 'Medium',
    subtopic: 'Binary Search', tags: ['binary-search'],
    links: { leetcode: lc('search-in-rotated-sorted-array') },
  },
  {
    topicSlug: 'searching-sorting', title: 'Peak Element', difficulty: 'Easy',
    subtopic: 'Binary Search', tags: ['binary-search'],
    links: { leetcode: lc('find-peak-element') },
  },
  {
    topicSlug: 'searching-sorting', title: 'K-th Element of Two Sorted Arrays', difficulty: 'Hard',
    subtopic: 'Binary Search', tags: ['binary-search'],
    links: { article: 'https://www.geeksforgeeks.org/k-th-element-two-sorted-arrays/' },
  },
  {
    topicSlug: 'searching-sorting', title: 'Allocate Minimum Pages', difficulty: 'Hard',
    subtopic: 'Binary Search on Answer', tags: ['binary-search'],
    links: { article: 'https://www.geeksforgeeks.org/allocate-minimum-number-pages/' },
  },
  {
    topicSlug: 'searching-sorting', title: 'Kth Missing Positive Number', difficulty: 'Easy',
    subtopic: 'Binary Search', tags: ['binary-search'],
    links: { leetcode: lc('kth-missing-positive-number') },
  },
  {
    topicSlug: 'searching-sorting', title: 'Sort 0s, 1s and 2s', difficulty: 'Easy',
    subtopic: 'Dutch National Flag', tags: ['sorting', 'two-pointer'],
    links: { leetcode: lc('sort-colors') },
  },
  {
    topicSlug: 'searching-sorting', title: 'Count Inversions', difficulty: 'Hard',
    subtopic: 'Merge Sort', tags: ['sorting', 'divide-and-conquer'],
    links: { article: 'https://www.geeksforgeeks.org/counting-inversions/' },
  },
  {
    topicSlug: 'searching-sorting', title: 'Merge Two Sorted Arrays Without Extra Space', difficulty: 'Hard',
    subtopic: 'Gap Method', tags: ['sorting', 'two-pointer'],
    links: { leetcode: lc('merge-sorted-array') },
  },
  {
    topicSlug: 'searching-sorting', title: 'Chocolate Distribution Problem', difficulty: 'Easy',
    subtopic: 'Sorting + Sliding Window', tags: ['sorting', 'greedy'],
    links: { article: 'https://www.geeksforgeeks.org/chocolate-distribution-problem/' },
  },

  // ─── Hashing (4) ─────────────────────────────────────────────────────────────
  {
    topicSlug: 'hashing', title: 'Print All Pairs with Given Sum', difficulty: 'Easy',
    subtopic: 'Hash Set', tags: ['hash-map'],
    links: { article: 'https://www.geeksforgeeks.org/print-all-pairs-with-given-sum/' },
  },
  {
    topicSlug: 'hashing', title: 'Longest Subsequence with Adjacent Difference of 0 or 1', difficulty: 'Medium',
    subtopic: 'Hash Map + DP', tags: ['hash-map', 'dp'],
    links: { article: 'https://www.geeksforgeeks.org/longest-subsequence-such-that-difference-between-adjacents-is-one/' },
  },
  {
    topicSlug: 'hashing', title: 'Longest Consecutive Sequence', difficulty: 'Medium',
    subtopic: 'Hash Set', tags: ['hash-set'],
    links: { leetcode: lc('longest-consecutive-sequence') },
  },
  {
    topicSlug: 'hashing', title: 'Count Subarrays with Given XOR', difficulty: 'Medium',
    subtopic: 'Prefix XOR', tags: ['hash-map', 'prefix-sum', 'bit-manipulation'],
    links: { article: 'https://www.geeksforgeeks.org/count-number-subarrays-given-xor/' },
  },

  // ─── Linked List (8) ─────────────────────────────────────────────────────────
  {
    topicSlug: 'linked-list', title: 'Reverse a Linked List', difficulty: 'Easy',
    subtopic: 'Iterative / Recursive', tags: ['pointers'],
    links: { leetcode: lc('reverse-linked-list') },
  },
  {
    topicSlug: 'linked-list', title: 'Detect Cycle in a Linked List', difficulty: 'Easy',
    subtopic: "Floyd's Cycle Detection", tags: ['two-pointer'],
    links: { leetcode: lc('linked-list-cycle') },
  },
  {
    topicSlug: 'linked-list', title: 'Merge Two Sorted Lists', difficulty: 'Easy',
    subtopic: 'Merge', tags: ['recursion'],
    links: { leetcode: lc('merge-two-sorted-lists') },
  },
  {
    topicSlug: 'linked-list', title: 'Merge K Sorted Lists', difficulty: 'Hard',
    subtopic: 'Heap / Divide & Conquer', tags: ['heap', 'divide-and-conquer'],
    links: { leetcode: lc('merge-k-sorted-lists') },
  },
  {
    topicSlug: 'linked-list', title: 'Remove Nth Node From End of List', difficulty: 'Medium',
    subtopic: 'Two Pointers', tags: ['two-pointer'],
    links: { leetcode: lc('remove-nth-node-from-end-of-list') },
  },
  {
    topicSlug: 'linked-list', title: 'Reorder List', difficulty: 'Medium',
    subtopic: 'Find Middle + Reverse + Merge', tags: ['two-pointer'],
    links: { leetcode: lc('reorder-list') },
  },
  {
    topicSlug: 'linked-list', title: 'Add 1 to a Number Represented as Linked List', difficulty: 'Easy',
    subtopic: 'Reverse + Carry', tags: ['recursion'],
    links: { article: 'https://www.geeksforgeeks.org/add-1-number-represented-linked-list/' },
  },
  {
    topicSlug: 'linked-list', title: 'Clone a Linked List with Random Pointer', difficulty: 'Medium',
    subtopic: 'Hash Map', tags: ['hash-map'],
    links: { leetcode: lc('copy-list-with-random-pointer') },
  },

  // ─── Stack, Queue & Deque (9) ────────────────────────────────────────────────
  {
    topicSlug: 'stacks-queues', title: 'Infix to Postfix Expression', difficulty: 'Medium',
    subtopic: 'Stack', tags: ['stack'],
    links: { article: 'https://www.geeksforgeeks.org/convert-infix-expression-to-postfix-expression/' },
  },
  {
    topicSlug: 'stacks-queues', title: 'Next Greater Element', difficulty: 'Medium',
    subtopic: 'Monotonic Stack', tags: ['monotonic', 'stack'],
    links: { leetcode: lc('next-greater-element-i') },
  },
  {
    topicSlug: 'stacks-queues', title: 'Largest Area in a Histogram', difficulty: 'Hard',
    subtopic: 'Monotonic Stack', tags: ['monotonic', 'stack'],
    links: { leetcode: lc('largest-rectangle-in-histogram') },
  },
  {
    topicSlug: 'stacks-queues', title: 'Delete Middle Element of a Stack', difficulty: 'Easy',
    subtopic: 'Recursion', tags: ['stack', 'recursion'],
    links: { article: 'https://www.geeksforgeeks.org/delete-middle-element-stack/' },
  },
  {
    topicSlug: 'stacks-queues', title: 'Length of the Longest Valid Substring', difficulty: 'Medium',
    subtopic: 'Stack', tags: ['stack'],
    links: { leetcode: lc('longest-valid-parentheses') },
  },
  {
    topicSlug: 'stacks-queues', title: 'Sum of Max of Subarrays', difficulty: 'Hard',
    subtopic: 'Monotonic Stack', tags: ['monotonic', 'stack'],
    links: { article: 'https://www.geeksforgeeks.org/sum-of-max-of-all-subarrays/' },
  },
  {
    topicSlug: 'stacks-queues', title: 'Next Greater Element in a Circular Array', difficulty: 'Medium',
    subtopic: 'Monotonic Stack', tags: ['monotonic', 'stack'],
    links: { leetcode: lc('next-greater-element-ii') },
  },
  {
    topicSlug: 'stacks-queues', title: 'Longest Bounded-Difference Subarray', difficulty: 'Medium',
    subtopic: 'Deque', tags: ['deque', 'sliding-window'],
    links: { article: 'https://www.geeksforgeeks.org/longest-subarray-in-which-absolute-difference-between-any-two-element-is-not-greater-than-x/' },
  },
  {
    topicSlug: 'stacks-queues', title: 'K Sized Subarray Maximum', difficulty: 'Hard',
    subtopic: 'Monotonic Deque', tags: ['deque', 'sliding-window'],
    links: { leetcode: lc('sliding-window-maximum') },
  },

  // ─── Trees (12) ──────────────────────────────────────────────────────────────
  {
    topicSlug: 'trees', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy',
    subtopic: 'DFS', tags: ['dfs', 'recursion'],
    links: { leetcode: lc('maximum-depth-of-binary-tree') },
  },
  {
    topicSlug: 'trees', title: 'Check for Mirror Trees', difficulty: 'Easy',
    subtopic: 'DFS', tags: ['dfs', 'recursion'],
    links: { leetcode: lc('symmetric-tree') },
  },
  {
    topicSlug: 'trees', title: 'Invert Binary Tree', difficulty: 'Easy',
    subtopic: 'DFS', tags: ['dfs', 'recursion'],
    links: { leetcode: lc('invert-binary-tree') },
  },
  {
    topicSlug: 'trees', title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard',
    subtopic: 'DFS', tags: ['dfs', 'dp'],
    links: { leetcode: lc('binary-tree-maximum-path-sum') },
  },
  {
    topicSlug: 'trees', title: 'Binary Tree Level Order Traversal', difficulty: 'Medium',
    subtopic: 'BFS', tags: ['bfs', 'queue'],
    links: { leetcode: lc('binary-tree-level-order-traversal') },
  },
  {
    topicSlug: 'trees', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard',
    subtopic: 'BFS / DFS', tags: ['design', 'bfs'],
    links: { leetcode: lc('serialize-and-deserialize-binary-tree') },
  },
  {
    topicSlug: 'trees', title: 'Subtree of Another Tree', difficulty: 'Easy',
    subtopic: 'DFS', tags: ['dfs', 'recursion'],
    links: { leetcode: lc('subtree-of-another-tree') },
  },
  {
    topicSlug: 'trees', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'Medium',
    subtopic: 'Divide & Conquer', tags: ['dfs', 'hash-map'],
    links: { leetcode: lc('construct-binary-tree-from-preorder-and-inorder-traversal') },
  },
  {
    topicSlug: 'trees', title: 'Validate Binary Search Tree', difficulty: 'Medium',
    subtopic: 'DFS', tags: ['dfs', 'bst'],
    links: { leetcode: lc('validate-binary-search-tree') },
  },
  {
    topicSlug: 'trees', title: 'Kth Smallest Element in a BST', difficulty: 'Medium',
    subtopic: 'Inorder Traversal', tags: ['dfs', 'bst'],
    links: { leetcode: lc('kth-smallest-element-in-a-bst') },
  },
  {
    topicSlug: 'trees', title: 'Lowest Common Ancestor of a BST', difficulty: 'Medium',
    subtopic: 'BST Property', tags: ['dfs', 'bst'],
    links: { leetcode: lc('lowest-common-ancestor-of-a-binary-search-tree') },
  },
  {
    topicSlug: 'trees', title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium',
    subtopic: 'Trie', tags: ['trie', 'design'],
    links: { leetcode: lc('implement-trie-prefix-tree') },
  },

  // ─── Heaps (4) ───────────────────────────────────────────────────────────────
  {
    topicSlug: 'heaps', title: 'Top K Frequent Elements', difficulty: 'Medium',
    subtopic: 'Min-Heap / Bucket Sort', tags: ['heap', 'hash-map'],
    links: { leetcode: lc('top-k-frequent-elements') },
  },
  {
    topicSlug: 'heaps', title: 'Find Median from Data Stream', difficulty: 'Hard',
    subtopic: 'Two Heaps', tags: ['heap', 'design'],
    links: { leetcode: lc('find-median-from-data-stream') },
  },
  {
    topicSlug: 'heaps', title: 'Largest Triplet Product in a Stream', difficulty: 'Medium',
    subtopic: 'Min-Heap', tags: ['heap'],
    links: { article: 'https://www.geeksforgeeks.org/find-the-largest-triplet-product-in-a-stream/' },
  },
  {
    topicSlug: 'heaps', title: 'Connect n Ropes with Minimum Cost', difficulty: 'Medium',
    subtopic: 'Min-Heap / Greedy', tags: ['heap', 'greedy'],
    links: { article: 'https://www.geeksforgeeks.org/connect-n-ropes-minimum-cost/' },
  },

  // ─── Graphs (12) ─────────────────────────────────────────────────────────────
  {
    topicSlug: 'graphs', title: 'Clone Graph', difficulty: 'Medium',
    subtopic: 'BFS / DFS', tags: ['bfs', 'dfs', 'hash-map'],
    links: { leetcode: lc('clone-graph') },
  },
  {
    topicSlug: 'graphs', title: 'Course Schedule', difficulty: 'Medium',
    subtopic: 'Topological Sort', tags: ['topological', 'bfs', 'cycle-detection'],
    links: { leetcode: lc('course-schedule') },
  },
  {
    topicSlug: 'graphs', title: 'Pacific Atlantic Water Flow', difficulty: 'Medium',
    subtopic: 'Multi-source BFS', tags: ['bfs', 'dfs'],
    links: { leetcode: lc('pacific-atlantic-water-flow') },
  },
  {
    topicSlug: 'graphs', title: 'Number of Islands', difficulty: 'Medium',
    subtopic: 'Flood Fill', tags: ['bfs', 'dfs', 'union-find'],
    links: { leetcode: lc('number-of-islands') },
  },
  {
    topicSlug: 'graphs', title: 'Snake and Ladder Problem', difficulty: 'Medium',
    subtopic: 'BFS Shortest Path', tags: ['bfs'],
    links: { leetcode: lc('snakes-and-ladders') },
  },
  {
    topicSlug: 'graphs', title: 'Detect Cycle in a Directed Graph', difficulty: 'Medium',
    subtopic: 'DFS / Kahn\'s Algorithm', tags: ['dfs', 'topological', 'cycle-detection'],
    links: { article: 'https://www.geeksforgeeks.org/detect-cycle-in-a-graph/' },
  },
  {
    topicSlug: 'graphs', title: 'Bridges in a Graph', difficulty: 'Hard',
    subtopic: "Tarjan's Algorithm", tags: ['dfs'],
    links: { article: 'https://www.geeksforgeeks.org/bridge-in-a-graph/' },
  },
  {
    topicSlug: 'graphs', title: 'Check for Bipartite', difficulty: 'Medium',
    subtopic: 'BFS 2-Coloring', tags: ['bfs', 'dfs'],
    links: { leetcode: lc('is-graph-bipartite') },
  },
  {
    topicSlug: 'graphs', title: 'Largest Region in Boolean Matrix', difficulty: 'Medium',
    subtopic: 'DFS / BFS', tags: ['dfs', 'bfs'],
    links: { article: 'https://www.geeksforgeeks.org/find-the-largest-region-in-boolean-matrix/' },
  },
  {
    topicSlug: 'graphs', title: 'Flood Fill Algorithm', difficulty: 'Easy',
    subtopic: 'DFS / BFS', tags: ['dfs', 'bfs'],
    links: { leetcode: lc('flood-fill') },
  },
  {
    topicSlug: 'graphs', title: 'Strongly Connected Components', difficulty: 'Hard',
    subtopic: "Kosaraju's / Tarjan's Algorithm", tags: ['dfs'],
    links: { article: 'https://www.geeksforgeeks.org/strongly-connected-components/' },
  },
  {
    topicSlug: 'graphs', title: 'Topological Sorting', difficulty: 'Medium',
    subtopic: 'DFS / Kahn\'s Algorithm', tags: ['dfs', 'topological'],
    links: { leetcode: lc('course-schedule-ii') },
  },

  // ─── Dynamic Programming & Greedy (20) ───────────────────────────────────────
  {
    topicSlug: 'dp-greedy', title: 'Count Ways to Reach the Nth Stair', difficulty: 'Easy',
    subtopic: '1D DP', tags: ['dp'],
    links: { leetcode: lc('climbing-stairs') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Coin Change', difficulty: 'Medium',
    subtopic: 'Unbounded Knapsack', tags: ['dp'],
    links: { leetcode: lc('coin-change') },
  },
  {
    topicSlug: 'dp-greedy', title: '0/1 Knapsack Problem', difficulty: 'Medium',
    subtopic: '2D DP', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Longest Increasing Subsequence', difficulty: 'Medium',
    subtopic: 'LIS', tags: ['dp', 'binary-search'],
    links: { leetcode: lc('longest-increasing-subsequence') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Longest Common Subsequence', difficulty: 'Medium',
    subtopic: '2D DP', tags: ['dp'],
    links: { leetcode: lc('longest-common-subsequence') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Word Break Problem', difficulty: 'Medium',
    subtopic: '1D DP', tags: ['dp', 'hash-set'],
    links: { leetcode: lc('word-break') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Dice Throw', difficulty: 'Medium',
    subtopic: '2D DP', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/dice-throw-dp-30/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Egg Dropping Puzzle', difficulty: 'Hard',
    subtopic: '2D DP / Binary Search', tags: ['dp', 'binary-search'],
    links: { leetcode: lc('super-egg-drop') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Matrix Chain Multiplication', difficulty: 'Hard',
    subtopic: 'Interval DP', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/matrix-chain-multiplication-dp-8/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Combination Sum', difficulty: 'Medium',
    subtopic: 'Backtracking', tags: ['backtracking', 'dp'],
    links: { leetcode: lc('combination-sum') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Subset Sum Problem', difficulty: 'Medium',
    subtopic: '2D DP / Bitset', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/subset-sum-problem-dp-25/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Maximum Possible Stolen Value', difficulty: 'Medium',
    subtopic: '1D DP', tags: ['dp', 'greedy'],
    links: { leetcode: lc('house-robber') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Count Possible Decodings of a Digit Sequence', difficulty: 'Medium',
    subtopic: '1D DP', tags: ['dp'],
    links: { leetcode: lc('decode-ways') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Unique Paths in a Grid with Obstacles', difficulty: 'Medium',
    subtopic: '2D DP', tags: ['dp'],
    links: { leetcode: lc('unique-paths-ii') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Jump Game', difficulty: 'Medium',
    subtopic: 'Greedy', tags: ['greedy', 'dp'],
    links: { leetcode: lc('jump-game') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Cutting a Rod', difficulty: 'Medium',
    subtopic: 'Unbounded Knapsack', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/cutting-a-rod-dp-13/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Maximum Product Cutting', difficulty: 'Medium',
    subtopic: 'Math / DP', tags: ['dp', 'math'],
    links: { leetcode: lc('integer-break') },
  },
  {
    topicSlug: 'dp-greedy', title: 'Count Number of Ways to Cover a Distance', difficulty: 'Easy',
    subtopic: '1D DP', tags: ['dp'],
    links: { article: 'https://www.geeksforgeeks.org/count-number-of-ways-to-cover-a-distance/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Connect n Ropes with Minimum Cost', difficulty: 'Medium',
    subtopic: 'Greedy / Min-Heap', tags: ['greedy', 'heap'],
    links: { article: 'https://www.geeksforgeeks.org/connect-n-ropes-minimum-cost/' },
  },
  {
    topicSlug: 'dp-greedy', title: 'Largest Number in One Swap', difficulty: 'Medium',
    subtopic: 'Greedy', tags: ['greedy'],
    links: { leetcode: lc('maximum-swap') },
  },

  // ─── Bit Manipulation (3) ────────────────────────────────────────────────────
  {
    topicSlug: 'bit-manipulation', title: 'Counting Bits', difficulty: 'Easy',
    subtopic: 'DP + Bit Trick', tags: ['bit-manipulation', 'dp'],
    links: { leetcode: lc('counting-bits') },
  },
  {
    topicSlug: 'bit-manipulation', title: 'Missing Number', difficulty: 'Easy',
    subtopic: 'XOR / Math', tags: ['bit-manipulation', 'math'],
    links: { leetcode: lc('missing-number') },
  },
  {
    topicSlug: 'bit-manipulation', title: 'Find XOR of All Subsets of a Set', difficulty: 'Easy',
    subtopic: 'XOR Property', tags: ['bit-manipulation', 'math'],
    links: { article: 'https://www.geeksforgeeks.org/find-xor-of-all-subsets-of-a-set/' },
  },
];
