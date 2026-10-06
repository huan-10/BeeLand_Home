import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { AlarmIcon } from 'phosphor-react-native/src/icons/Alarm';
import { ArrowDownIcon } from 'phosphor-react-native/src/icons/ArrowDown';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';

import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { BellRingingIcon } from 'phosphor-react-native/src/icons/BellRinging';
import { BellSlashIcon } from 'phosphor-react-native/src/icons/BellSlash';
import { BuildingsIcon } from 'phosphor-react-native/src/icons/Buildings';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChatCircleTextIcon } from 'phosphor-react-native/src/icons/ChatCircleText';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ChecksIcon } from 'phosphor-react-native/src/icons/Checks';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { CloudSlashIcon } from 'phosphor-react-native/src/icons/CloudSlash';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { EnvelopeSimpleOpenIcon } from 'phosphor-react-native/src/icons/EnvelopeSimpleOpen';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { HourglassMediumIcon } from 'phosphor-react-native/src/icons/HourglassMedium';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { KeyIcon } from 'phosphor-react-native/src/icons/Key';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { MoneyIcon } from 'phosphor-react-native/src/icons/Money';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TrayIcon } from 'phosphor-react-native/src/icons/Tray';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { WalletIcon } from 'phosphor-react-native/src/icons/Wallet';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { IdentificationCardIcon } from 'phosphor-react-native/src/icons/IdentificationCard';
import { UploadSimpleIcon } from 'phosphor-react-native/src/icons/UploadSimple';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { TrophyIcon } from 'phosphor-react-native/src/icons/Trophy';
import { ListChecksIcon } from 'phosphor-react-native/src/icons/ListChecks';
import { BookOpenTextIcon } from 'phosphor-react-native/src/icons/BookOpenText';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { TimerIcon } from 'phosphor-react-native/src/icons/Timer';
import { FilePdfIcon } from 'phosphor-react-native/src/icons/FilePdf';
import { ConfettiIcon } from 'phosphor-react-native/src/icons/Confetti';
import { PrinterIcon } from 'phosphor-react-native/src/icons/Printer';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';

/**
 * Bộ icon duy nhất của dự án: Phosphor Icons (phosphor-react-native) — bo tròn mềm, nhiều kiểu nét
 * (regular / bold / fill / duotone) nên trông hiện đại hơn bộ outline cũ. Không dùng emoji.
 * Import từng icon (`phosphor-react-native/src/icons/<Tên>`) để chỉ đóng gói icon thật sự dùng.
 * Gọi bằng tên ngữ nghĩa qua `<Icon name="…">` — đổi bộ icon về sau chỉ cần sửa file này.
 */
export const icons = {
  alarm: AlarmIcon,
  arrowUp: ArrowUpIcon,
  arrowDown: ArrowDownIcon,
  plusCircle: PlusCircleIcon,
  minusCircle: MinusCircleIcon,
  sliders: SlidersHorizontalIcon,
  alertCircle: WarningCircleIcon,
  arrowRight: ArrowRightIcon,
  bell: BellIcon,
  bellOff: BellSlashIcon,
  bellRing: BellRingingIcon,
  building: BuildingsIcon,
  calendar: CalendarDotsIcon,
  calendarCheck: CalendarCheckIcon,
  card: CreditCardIcon,
  cash: MoneyIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  checkDouble: ChecksIcon,
  chevronLeft: CaretLeftIcon,
  chevronRight: CaretRightIcon,
  clock: ClockIcon,
  close: XIcon,
  closeCircle: XCircleIcon,
  compass: CompassIcon,
  copy: CopyIcon,
  document: FileTextIcon,
  download: DownloadSimpleIcon,
  external: ArrowSquareOutIcon,
  eye: EyeIcon,
  eyeOff: EyeSlashIcon,
  home: HouseIcon,
  hourglass: HourglassMediumIcon,
  inbox: TrayIcon,
  info: InfoIcon,
  key: KeyIcon,
  lock: LockSimpleIcon,
  logout: SignOutIcon,
  mail: EnvelopeSimpleIcon,
  mailOpen: EnvelopeSimpleOpenIcon,
  message: ChatCircleTextIcon,
  offline: CloudSlashIcon,
  phone: PhoneIcon,
  receipt: ReceiptIcon,
  refresh: ArrowsClockwiseIcon,
  search: MagnifyingGlassIcon,
  share: ShareNetworkIcon,
  user: UserIcon,
  wallet: WalletIcon,
  warning: WarningIcon,
  idCard: IdentificationCardIcon,
  upload: UploadSimpleIcon,
  camera: CameraIcon,
  image: ImageIcon,
  trash: TrashIcon,
  trophy: TrophyIcon,
  listChecks: ListChecksIcon,
  book: BookOpenTextIcon,
  mapPin: MapPinIcon,
  users: UsersThreeIcon,
  shieldCheck: ShieldCheckIcon,
  timer: TimerIcon,
  filePdf: FilePdfIcon,
  confetti: ConfettiIcon,
  printer: PrinterIcon,
  chevronDown: CaretDownIcon,
  chevronUp: CaretUpIcon,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof icons;

/**
 * Kiểu nét icon:
 * - `line` (mặc định): nét thường — icon trong nút, dòng thông tin.
 * - `bold`: nét đậm — mũi tên nhỏ, dấu tích, icon trên nền màu.
 * - `fill`: đặc — tab / mục đang chọn.
 * - `duotone`: nét + nền mờ cùng màu — icon trong ô tròn (ô chức năng, thông báo, trạng thái).
 */
export type IconVariant = 'line' | 'bold' | 'fill' | 'duotone';

export const iconWeight = { line: 'regular', bold: 'bold', fill: 'fill', duotone: 'duotone' } as const satisfies Record<IconVariant, string>;

/** Độ mờ lớp nền của kiểu duotone. */
export const iconDuotoneOpacity = 0.28;
