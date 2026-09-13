type CommunityDataErrorProps = {
  className?: string;
  message?: string;
};

export function CommunityDataError({
  className = "",
  message = "글을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."
}: CommunityDataErrorProps) {
  return (
    <div role="alert" className={`${className} rounded-2xl bg-[var(--sand)] px-5 py-4 text-sm leading-6`}>
      {message}
    </div>
  );
}
