import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClose: () => void;
}

// A failed lazy import must not unmount the address form and the whole page.
export class AddressMapErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Không tải được bản đồ địa chỉ", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <div className="address-map-picker field-span" role="alert">
        <p>Không mở được bản đồ. Hãy tải lại trang rồi thử lại. Thông tin bạn đã nhập vẫn còn trong form khi đóng thông báo này.</p>
        <button type="button" className="outline-button" onClick={this.props.onClose}>Đóng bản đồ</button>
      </div>;
    }
    return this.props.children;
  }
}
