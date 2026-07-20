type BotanicalDecorationProps = {
  className?: string;
};

export function BotanicalDecoration({
  className,
}: BotanicalDecorationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 170"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M88 163C87 126 91 91 102 59" />
      <path d="M92 129C74 117 57 107 36 103" />
      <path d="M91 112C108 102 124 94 143 94" />
      <path d="M96 82C82 73 73 63 67 49" />
      <path d="M101 62C117 57 130 48 139 34" />
      <path d="M37 103C50 101 58 108 59 120C46 120 39 114 37 103Z" />
      <path d="M143 94C132 89 124 92 119 103C130 107 139 104 143 94Z" />
      <path d="M67 49C79 53 84 61 80 73C68 69 64 61 67 49Z" />
      <path d="M139 34C138 47 131 53 119 52C120 40 127 34 139 34Z" />
      <path d="M104 58C95 61 84 58 78 50C72 42 73 31 82 24C90 18 102 19 109 26C116 18 128 17 136 23C145 30 147 41 141 50C135 59 123 63 113 59" />
      <path d="M108 28C104 38 104 47 108 58" />
      <path d="M83 27C91 34 98 43 104 57" />
      <path d="M135 25C126 33 118 44 112 58" />
      <path d="M78 49C88 48 97 51 105 58" />
      <path d="M141 49C130 48 121 51 113 59" />
      <path d="M104 58C107 54 112 54 115 58C113 64 106 65 104 58Z" />
    </svg>
  );
}
