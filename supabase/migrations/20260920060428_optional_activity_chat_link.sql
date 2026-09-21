-- 모임을 먼저 개설하고 채팅방 안내를 나중에 추가할 수 있게 한다.
alter table public.activity_chat_details drop constraint activity_chat_details_chat_url_check;
alter table public.activity_chat_details alter column chat_url set default '';
alter table public.activity_chat_details add constraint activity_chat_details_chat_url_length check (length(chat_url) <= 1000);
