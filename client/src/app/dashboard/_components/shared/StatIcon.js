const tones = {
  blue: "bg-blue-50 text-blue-500",
  green: "bg-green-50 text-green-500",
  purple: "bg-purple-50 text-purple-500",
  orange: "bg-orange-50 text-orange-500",
  red: "bg-red-50 text-red-500",
};

export default function StatIcon({ icon: Icon, tone = "blue", className }) {
  return (
    <div
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${className || tones[tone]}`}
    >
      <Icon size={20} strokeWidth={1.8} />
    </div>
  );
}
