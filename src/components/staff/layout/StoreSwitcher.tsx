import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  MapPin,
  Store,
} from "lucide-react";
import type { StoreOption } from "../../../types/staff";

type Props = {
  stores: StoreOption[];
  selectedStoreId: string;
  onChange: (storeId: string) => void;
};

export default function StoreSwitcher({
  stores,
  selectedStoreId,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedStore = stores.find(
    (store) => String(store.id) === String(selectedStoreId),
  );

  // Đóng dropdown khi nhấn bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Đóng dropdown bằng phím Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (storeId: string) => {
    onChange(storeId);
    setIsOpen(false);
  };

  return (
    <div
      className={`store-switcher ${isOpen ? "store-switcher--open" : ""}`}
      ref={containerRef}
    >
      {/* Nút chọn cửa hàng */}
      <button
        type="button"
        className="store-switcher__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="store-switcher__icon">
          <Store size={19} />
        </span>

        <span className="store-switcher__field">
          <span className="store-switcher__label">
            Cửa hàng đang làm việc
          </span>

          <span className="store-switcher__selected">
            {selectedStore?.name ?? "Chọn cửa hàng"}
          </span>
        </span>

        <ChevronDown
          className={`store-switcher__chevron ${
            isOpen ? "store-switcher__chevron--open" : ""
          }`}
          size={17}
        />
      </button>

      {/* Danh sách cửa hàng */}
      {isOpen && (
        <div className="store-switcher__dropdown">
          <div className="store-switcher__dropdown-header">
            <div>
              <h3>Chọn cửa hàng</h3>
              <p>Chọn cửa hàng bạn được phân công</p>
            </div>

            <span className="store-switcher__count">
              {stores.length}
            </span>
          </div>

          <div
            className="store-switcher__options"
            role="listbox"
            aria-label="Danh sách cửa hàng"
          >
            {stores.length > 0 ? (
              stores.map((store) => {
                const isSelected =
                  String(store.id) === String(selectedStoreId);

                return (
                  <button
                    type="button"
                    key={store.id}
                    className={`store-switcher__option ${
                      isSelected
                        ? "store-switcher__option--selected"
                        : ""
                    }`}
                    onClick={() => handleSelect(String(store.id))}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="store-switcher__option-icon">
                      <Store size={19} />
                    </span>

                    <span className="store-switcher__option-content">
                      <span className="store-switcher__option-name">
                        {store.name}
                      </span>

                      <span className="store-switcher__option-description">
                        <MapPin size={13} />
                        <span>
                          {isSelected
                            ? "Cửa hàng đang được chọn"
                            : "Nhấn để chuyển cửa hàng"}
                        </span>
                      </span>
                    </span>

                    {isSelected && (
                      <span className="store-switcher__option-check">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="store-switcher__empty">
                <Store size={25} />
                <p>Chưa có cửa hàng nào.</p>
              </div>
            )}
          </div>

          <div className="store-switcher__dropdown-footer">
            <span>
              <span className="store-switcher__status-dot" />
              {stores.length} cửa hàng khả dụng
            </span>
          </div>
        </div>
      )}
    </div>
  );
}