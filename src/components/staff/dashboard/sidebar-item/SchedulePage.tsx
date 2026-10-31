import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import "./SchedulePage.css";
import RefreshDataButton from "../../ui/RefreshDataButton";
import { useStaffFetched } from "../../../../hooks/useStaffFetched";
import { staffService } from "../../../../services/staff";
import { BOOKING_STATUS_LABELS } from "../../../../services/booking";
import type { BookingStatus } from "../../../../types/booking";

export interface SelectedStore {
  id: number;
  name: string;
}

interface SchedulePageProps {
  selectedStore: SelectedStore | null;
}

type ViewMode = "week" | "day";

interface ScheduleEvent {
  id: number;
  storeId: number;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "processing" | "completed" | "pending";
  bookingStatus: BookingStatus;
}

const storeDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
});
const storeTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function storeDay(value: string | Date) {
  const parts = storeDateFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function storeToday() { return new Date(`${storeDay(new Date())}T12:00:00`); }

const WEEKDAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));

  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDateRange(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} tháng ${
      start.getMonth() + 1
    }, ${start.getFullYear()}`;
  }

  return `${formatShortDate(start)} – ${formatShortDate(end)}, ${end.getFullYear()}`;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export default function SchedulePage({
  selectedStore,
}: SchedulePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(storeToday()),
  );
  const [selectedDate, setSelectedDate] = useState(() => storeToday());
  const [selectedEvent, setSelectedEvent] =
    useState<ScheduleEvent | null>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeek, index)),
    [currentWeek],
  );

  const visibleDates =
    viewMode === "week"
      ? weekDates
      : [new Date(selectedDate)];

  const [reloadToken, setReloadToken] = useState(0);
  const eventsFetch = useStaffFetched(
    selectedStore ? `staff-bookings:${selectedStore.id}` : null,
    (signal) => staffService.getStoreBookingsWithCustomers(selectedStore!.id, signal),
    reloadToken,
  );
  const events = useMemo<ScheduleEvent[]>(
    () => (eventsFetch.data ?? [])
      .filter((booking) => booking.status !== "cancelled" && booking.status !== "no_show")
      .map((booking) => ({
        id: booking.id,
        storeId: booking.store_id,
        bookingCode: booking.booking_code,
        serviceName: booking.service_name,
        customerName: booking.customer?.full_name ?? "Chưa có thông tin",
        date: storeDay(booking.scheduled_pickup_start),
        startTime: storeTimeFormatter.format(new Date(booking.scheduled_pickup_start)),
        endTime: storeDay(booking.scheduled_pickup_end) === storeDay(booking.scheduled_pickup_start)
          ? storeTimeFormatter.format(new Date(booking.scheduled_pickup_end)) : "24:00",
        status: booking.status === "pending_payment" ? "pending"
          : booking.status === "completed" ? "completed"
          : booking.status === "confirmed" || booking.status === "picked_up" ? "confirmed" : "processing",
        bookingStatus: booking.status,
      })),
    [eventsFetch.data],
  );
  const weekEnd = addDays(currentWeek, 6);

  const visibleEvents = events.filter((event) =>
    visibleDates.some(
      (date) => formatDateKey(date) === event.date,
    ),
  );

  const firstHour = Math.min(7, ...visibleEvents.map((event) => Number(event.startTime.slice(0, 2))));
  const lastHour = Math.min(24, Math.max(19, ...visibleEvents.map((event) => {
    const [hour, minute] = event.endTime.split(":").map(Number);
    return hour + (minute > 0 ? 1 : 0);
  })));
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index);

  function goToPrevious() {
    if (viewMode === "week") {
      setCurrentWeek((current) => addDays(current, -7));
    } else {
      setSelectedDate((current) => addDays(current, -1));
    }
  }

  function goToNext() {
    if (viewMode === "week") {
      setCurrentWeek((current) => addDays(current, 7));
    } else {
      setSelectedDate((current) => addDays(current, 1));
    }
  }

  function goToToday() {
    const today = storeToday();
    setCurrentWeek(startOfWeek(today));
    setSelectedDate(today);
  }

  function changeView(mode: ViewMode) {
    setViewMode(mode);

    if (mode === "day") {
      setSelectedDate(storeToday());
    }
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setViewMode("day");
  }

  function getEventPosition(event: ScheduleEvent) {
    const [startHour, startMinute] = event.startTime
      .split(":")
      .map(Number);

    const [endHour, endMinute] = event.endTime
      .split(":")
      .map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return {
      top: (startMinutes - firstHour * 60) / 60,
      height: Math.max((endMinutes - startMinutes) / 60, 0.5),
    };
  }

  const isToday = (date: Date) =>
    formatDateKey(date) === formatDateKey(storeToday());

  return (
    <div className="schedule-page">
      <header className="schedule-page__header">
        <div className="schedule-page__title-icon">
          <CalendarDays size={27} />
        </div>

        <div>
          <h1>Lịch làm việc</h1>
          <p>
            Theo dõi lịch hẹn và kế hoạch xử lý đơn hàng
          </p>
        </div>
        <RefreshDataButton
          loading={eventsFetch.status === "loading"}
          disabled={!selectedStore}
          onRefresh={() => { setSelectedEvent(null); setReloadToken((value) => value + 1); }}
        />
      </header>

      <section className="schedule-store">
        <div className="schedule-store__icon">
          <MapPin size={18} />
        </div>

        <div className="schedule-store__content">
          <span>Cửa hàng đang làm việc</span>
          <strong>
            {selectedStore?.name ?? "Chưa chọn cửa hàng"}
          </strong>
        </div>
      </section>

      <section className="schedule-calendar">
        <div className="schedule-toolbar">
          <div className="schedule-view-toggle">
            <button
              type="button"
              className={
                viewMode === "week"
                  ? "is-active"
                  : ""
              }
              onClick={() => changeView("week")}
            >
              Tuần
            </button>

            <button
              type="button"
              className={
                viewMode === "day"
                  ? "is-active"
                  : ""
              }
              onClick={() => changeView("day")}
            >
              Ngày
            </button>
          </div>

          <div className="schedule-navigation">
            <button
              type="button"
              className="schedule-icon-button"
              onClick={goToPrevious}
              aria-label="Khoảng thời gian trước"
            >
              <ChevronLeft size={21} />
            </button>

            <div className="schedule-date-range">
              {viewMode === "week"
                ? formatDateRange(currentWeek, weekEnd)
                : selectedDate.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
            </div>

            <button
              type="button"
              className="schedule-icon-button"
              onClick={goToNext}
              aria-label="Khoảng thời gian tiếp theo"
            >
              <ChevronRight size={21} />
            </button>
          </div>

          <button
            type="button"
            className="schedule-today-button"
            onClick={goToToday}
          >
            Hôm nay
          </button>
        </div>

        {!selectedStore ? (
          <div className="schedule-empty">
            <CalendarDays size={40} />
            <h3>Chưa chọn cửa hàng</h3>
            <p>
              Vui lòng chọn cửa hàng để xem lịch làm việc.
            </p>
          </div>
        ) : eventsFetch.status === "loading" ? <p role="status">Đang tải lịch hoạt động...</p>
          : eventsFetch.status === "error" ? <p role="alert">{eventsFetch.error}</p>
          : (
          <>
            <p>Lịch hẹn theo thời gian nhận đồ. Không bao gồm đơn đã hủy hoặc khách không đến.</p>
            <div className="schedule-legend">
              <span>
                <i className="schedule-dot schedule-dot--confirmed" />
                Đã xác nhận
              </span>

              <span>
                <i className="schedule-dot schedule-dot--processing" />
                Đang xử lý
              </span>

              <span>
                <i className="schedule-dot schedule-dot--completed" />
                Hoàn thành
              </span>

              <span>
                <i className="schedule-dot schedule-dot--pending" />
                Chờ thanh toán
              </span>
            </div>

            <div className="schedule-grid-wrapper">
              <div
                className={`schedule-grid ${
                  viewMode === "day"
                    ? "schedule-grid--day"
                    : ""
                }`}
                style={
                  {
                    "--day-count": visibleDates.length,
                  } as React.CSSProperties
                }
              >
                <div className="schedule-grid__header">
                  <div className="schedule-grid__time-heading">
                    Thời gian
                  </div>

                  {visibleDates.map((date) => {
                    const dayIndex = (date.getDay() + 6) % 7;

                    return (
                      <button
                        type="button"
                        className={`schedule-day-heading ${
                          isToday(date) ? "is-today" : ""
                        } ${
                          formatDateKey(date) ===
                          formatDateKey(selectedDate)
                            ? "is-selected"
                            : ""
                        }`}
                        key={formatDateKey(date)}
                        onClick={() => handleDateClick(date)}
                      >
                        <span>{WEEKDAYS[dayIndex]}</span>
                        <strong>{date.getDate()}</strong>
                        <small>
                          Tháng {date.getMonth() + 1}
                        </small>
                      </button>
                    );
                  })}
                </div>

                <div className="schedule-grid__body">
                  <div className="schedule-time-column">
                    {hours.map((hour) => (
                      <div
                        className="schedule-time-slot"
                        key={hour}
                      >
                        {`${String(hour).padStart(2, "0")}:00`}
                      </div>
                    ))}
                  </div>

                  {visibleDates.map((date) => {
                    const dateKey = formatDateKey(date);

                    const dayEvents = events.filter(
                      (event) => event.date === dateKey,
                    );

                    return (
                      <div
                        className="schedule-day-column"
                        key={dateKey}
                      >
                        {hours.map((hour) => (
                          <div
                            className="schedule-hour-cell"
                            key={hour}
                          />
                        ))}

                        {dayEvents.map((event) => {
                          const position =
                            getEventPosition(event);

                          return (
                            <button
                              type="button"
                              key={event.id}
                              className={`schedule-event schedule-event--${event.status}`}
                              style={{
                                top: `calc(var(--schedule-row-height) * ${position.top})`,
                                height: `calc(var(--schedule-row-height) * ${position.height})`,
                              }}
                              onClick={() =>
                                setSelectedEvent(event)
                              }
                            >
                              <strong className="schedule-event__code">
                                {event.bookingCode}
                              </strong>

                              <span className="schedule-event__service">
                                {event.serviceName}
                              </span>

                              <span className="schedule-event__time">
                                <Clock3 size={12} />
                                {formatTime(event.startTime)}
                                {" – "}
                                {formatTime(event.endTime)}
                              </span>

                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="schedule-summary">
              <div className="schedule-summary__icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <strong>
                  {visibleEvents.length} lịch hẹn
                </strong>
                <span>
                  {" "}
                  trong{" "}
                  {viewMode === "week"
                    ? "tuần này"
                    : "ngày đã chọn"}
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedEvent && (
        <div
          className="schedule-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEvent(null);
            }
          }}
        >
          <section
            className="schedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
          >
            <div className="schedule-modal__header">
              <div>
                <span>Chi tiết lịch hẹn</span>
                <h2 id="schedule-modal-title">
                  {selectedEvent.bookingCode}
                </h2>
              </div>

              <button
                type="button"
                className="schedule-icon-button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="schedule-modal__body">
              <div>
                <span>Dịch vụ</span>
                <strong>{selectedEvent.serviceName}</strong>
              </div>

              <div>
                <span>Khách hàng</span>
                <strong>{selectedEvent.customerName}</strong>
              </div>

              <div>
                <span>Ngày</span>
                <strong>
                  {new Date(
                    `${selectedEvent.date}T12:00:00`,
                  ).toLocaleDateString("vi-VN")}
                </strong>
              </div>

              <div>
                <span>Thời gian</span>
                <strong>
                  {selectedEvent.startTime}
                  {" – "}
                  {selectedEvent.endTime}
                </strong>
              </div>

              <div>
                <span>Trạng thái</span>
                <strong>
                  {BOOKING_STATUS_LABELS[selectedEvent.bookingStatus]}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="schedule-modal__close"
              onClick={() => setSelectedEvent(null)}
            >
              Đóng
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
