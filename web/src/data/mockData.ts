// ─── Types ───────────────────────────────────────────────────────────────────
export type AttendanceRecord = {
  id: string
  employeeName: string
  avatar?: string
  timeIn: string
  statusIn: 'On-Time' | 'In Tolerance' | 'Late' | 'others' | 'Early Check-Out'
  locationIn: 'In-Area' | 'Work From Home' | 'Out of Area'
  timeOut: string | null
  statusOut: 'On-Time' | 'Early Check-Out' | 'Normal' | null
  status: 'Check In' | 'Present' | 'Absent'
  workHour: string | null
}

export type Employee = {
  id: string
  employeeId: string
  fullName: string
  email: string
  position: string
  positionTitle: string
  accessType: string
  activeDuration: string
  isActive: boolean
  joinDate: string
  group: string
}

export type Zone = {
  id: string
  officeName: string
  officeAddress: string
  latitude: number
  longitude: number
  radiusMeters: number
}

export type Position = {
  id: string
  no: number
  positionCode: string
  positionName: string
}

export type Grade = {
  id: string
  no: number
  gradeCode: string
  gradeName: string
}

export type EmploymentStatus = {
  id: string
  no: number
  code: string
  name: string
}

export type LiveLocation = {
  id: string
  employeeName: string
  type: 'check-in' | 'check-out'
  statusIn: string
  locationStatus: 'In Zone' | 'Out Zone'
  time: string
  date: string
  lat: number
  lng: number
}

// ─── Attendance Data ──────────────────────────────────────────────────────────
export const attendanceRecords: AttendanceRecord[] = [
  { id: '1',  employeeName: 'Raras Dwistian Nuari',    timeIn: '09:26:21 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '2',  employeeName: 'Umar Kholiq Jadid',       timeIn: '08:33:00 WIB', statusIn: 'others',        locationIn: 'Work From Home', timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '3',  employeeName: 'M Iqbal Amanta',          timeIn: '11:11:19 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '4',  employeeName: 'Salsabila Nur Shinta',    timeIn: '09:01:45 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '5',  employeeName: 'VINKCY FIRMAN PRATAMA',   timeIn: '09:11:54 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '6',  employeeName: 'Toha Hasan Al Alwan',     timeIn: '14:55:38 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: '14:56:02 WIB', statusOut: 'Early Check-Out', status: 'Present',  workHour: '00:00:24' },
  { id: '7',  employeeName: 'Desta Annur Rizky B.S',   timeIn: '07:55:36 WIB', statusIn: 'On-Time',       locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '8',  employeeName: 'Amanda Putra',            timeIn: '09:46:19 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '9',  employeeName: 'Fakhrusihaq Khosyi',      timeIn: '09:24:41 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '10', employeeName: 'FIRSTIAN DHAFA ANGGRIAS', timeIn: '09:12:21 WIB', statusIn: 'others',        locationIn: 'Work From Home', timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '11', employeeName: 'Ahmad Naufal Musyaffa',   timeIn: '08:40:52 WIB', statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '12', employeeName: 'Firna Ollena Fasa',       timeIn: '05:53:55 WIB', statusIn: 'On-Time',       locationIn: 'In-Area',        timeOut: '12:54:57 WIB', statusOut: 'Early Check-Out', status: 'Present',  workHour: '07:01:02' },
  { id: '13', employeeName: 'Gabriella Advani M.',     timeIn: '-',            statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Absent',   workHour: null },
  { id: '14', employeeName: 'Halim Santoso',           timeIn: '10:05:00 WIB', statusIn: 'Late',          locationIn: 'In-Area',        timeOut: '17:00:00 WIB', statusOut: 'Normal',         status: 'Present',  workHour: '06:55:00' },
  { id: '15', employeeName: 'Indah Permata Sari',      timeIn: '08:00:01 WIB', statusIn: 'On-Time',       locationIn: 'In-Area',        timeOut: '17:00:10 WIB', statusOut: 'Normal',         status: 'Present',  workHour: '09:00:09' },
  { id: '16', employeeName: 'Joko Susilo',             timeIn: '08:15:30 WIB', statusIn: 'In Tolerance',  locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
  { id: '17', employeeName: 'Kartika Dewi',            timeIn: '-',            statusIn: 'others',        locationIn: 'In-Area',        timeOut: null,          statusOut: null,            status: 'Absent',   workHour: null },
  { id: '18', employeeName: 'Lukman Hakim',            timeIn: '09:30:00 WIB', statusIn: 'Late',          locationIn: 'Work From Home', timeOut: null,          statusOut: null,            status: 'Check In', workHour: null },
]

export const summaryStats = {
  onTime: 3,
  inTolerance: 1,
  late: 18,
  correctionTime: 0,
  inLocation: 20,
  inToleranceLocation: 2,
  outOfLocation: 0,
  correctionLocation: 0,
}

// ─── Employee Data ────────────────────────────────────────────────────────────
export const employees: Employee[] = [
  { id: '1',  employeeId: '13',   fullName: 'Abil Yahya Assyadili',          email: 'abiabill.696@gmail.com',       position: 'Staff',     positionTitle: '-',       accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: false, joinDate: '2024-06-01', group: 'General' },
  { id: '2',  employeeId: '07',   fullName: 'Ahmad Naufal Musyaffa',         email: 'naufali.musyaffaa@gmail.com',  position: 'Staff',     positionTitle: '-',       accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '3',  employeeId: '11',   fullName: 'Amanda Putra',                  email: 'amandapvtra98@gmail.com',      position: 'Staff',     positionTitle: '-',       accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '4',  employeeId: '09',   fullName: 'Desta Annur Rizky B.S',         email: 'brographofficial@gmail.com',   position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '5',  employeeId: '06',   fullName: 'Destoe Christanto',             email: 'destoech@gmail.com',           position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: false, joinDate: '2024-06-01', group: 'General' },
  { id: '6',  employeeId: '0343', fullName: 'FIRSTIAN DHAFA ANGGRIAS RAHMAT FAHREZI', email: 'queenriz394@gmail.com', position: 'Staff', positionTitle: '-',     accessType: 'Staff', activeDuration: '7 Months 6 Days',  isActive: true,  joinDate: '2024-08-20', group: 'General' },
  { id: '7',  employeeId: '10',   fullName: 'Fakhrusihaq Khosyi',            email: 'fakhrusihaq@gmail.com',        position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '8',  employeeId: '05',   fullName: 'Firna Ollena Fasa',             email: 'firnaollenaf@gmail.com',       position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '9',  employeeId: '03',   fullName: 'Gabriella Advani Millenia Fanty Akhmad', email: 'rivanitaakhmad@gmail.com', position: 'Staff', positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: false, joinDate: '2024-06-01', group: 'General' },
  { id: '10', employeeId: '12',   fullName: 'Halim Santoso',                 email: 'halimsantoso@gmail.com',       position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '11', employeeId: '08',   fullName: 'Indah Permata Sari',            email: 'indahpermata@gmail.com',       position: 'Supervisor', positionTitle: 'PD2',    accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '12', employeeId: '04',   fullName: 'Joko Susilo',                   email: 'jokosusilo@gmail.com',         position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
  { id: '13', employeeId: '01',   fullName: 'Raras Dwistian Nuari',          email: 'rarasdwistian@gmail.com',      position: 'Staff',     positionTitle: 'Pegawai', accessType: 'Staff', activeDuration: '9 Months 23 Days', isActive: true,  joinDate: '2024-06-01', group: 'General' },
]

// ─── Zone Data ────────────────────────────────────────────────────────────────
export const zones: Zone[] = [
  {
    id: '1',
    officeName: 'Kantor Pusat',
    officeAddress: 'QMXH+WF, Area Sawah/Kebun, Tegal Besar, Kec. Kaliwates, Kabupaten Jember, Jawa Timur, Indonesia',
    latitude: -8.200565,
    longitude: 113.6792966,
    radiusMeters: 200,
  },
]

// ─── Hierarchy Data ───────────────────────────────────────────────────────────
export const positions: Position[] = [
  { id: '1', no: 1, positionCode: '1',   positionName: 'Staff' },
  { id: '2', no: 2, positionCode: 'PD1', positionName: 'Staff' },
  { id: '3', no: 3, positionCode: 'PD2', positionName: 'Supervisor' },
  { id: '4', no: 4, positionCode: 'PD3', positionName: 'Executive' },
  { id: '5', no: 5, positionCode: 'PD4', positionName: 'Admin HRD' },
]

export const grades: Grade[] = [
  { id: '1', no: 1, gradeCode: 'G1', gradeName: 'Grade 1 - Entry Level' },
  { id: '2', no: 2, gradeCode: 'G2', gradeName: 'Grade 2 - Junior' },
  { id: '3', no: 3, gradeCode: 'G3', gradeName: 'Grade 3 - Mid Level' },
  { id: '4', no: 4, gradeCode: 'G4', gradeName: 'Grade 4 - Senior' },
  { id: '5', no: 5, gradeCode: 'G5', gradeName: 'Grade 5 - Manager' },
]

export const employmentStatuses: EmploymentStatus[] = [
  { id: '1', no: 1, code: 'PKWT', name: 'Pegawai Kontrak' },
  { id: '2', no: 2, code: 'PKWTT', name: 'Pegawai Tetap' },
  { id: '3', no: 3, code: 'PART', name: 'Part Time' },
  { id: '4', no: 4, code: 'INTERN', name: 'Magang' },
]

// ─── Live Location Data ───────────────────────────────────────────────────────
export const liveLocations: LiveLocation[] = [
  { id: '1',  employeeName: 'Toha Hasan Al Alwan',    type: 'check-out', statusIn: 'Early Check-Out', locationStatus: 'In Zone',  time: '14:56:02 WIB', date: '12-03-2026', lat: -8.1978, lng: 113.6942 },
  { id: '2',  employeeName: 'Toha Hasan Al Alwan',    type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '14:55:38 WIB', date: '12-03-2026', lat: -8.1978, lng: 113.6942 },
  { id: '3',  employeeName: 'Firna Ollena Fasa',      type: 'check-out', statusIn: 'Early Check-Out', locationStatus: 'In Zone',  time: '12:54:57 WIB', date: '12-03-2026', lat: -8.2005, lng: 113.6793 },
  { id: '4',  employeeName: 'M Iqbal Amanta',         type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '11:11:19 WIB', date: '12-03-2026', lat: -8.2012, lng: 113.6800 },
  { id: '5',  employeeName: 'Amanda Putra',           type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '09:46:19 WIB', date: '12-03-2026', lat: -8.2008, lng: 113.6788 },
  { id: '6',  employeeName: 'Raras Dwistian Nuari',   type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '09:26:21 WIB', date: '12-03-2026', lat: -8.1995, lng: 113.6805 },
  { id: '7',  employeeName: 'Fakhrusihaq Khosyi',     type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '09:24:41 WIB', date: '12-03-2026', lat: -8.2001, lng: 113.6795 },
  { id: '8',  employeeName: 'FIRSTIAN DHAFA ANGGRIAS RAHMAT FAHREZI', type: 'check-in', statusIn: 'others', locationStatus: 'Out Zone', time: '09:12:21 WIB', date: '12-03-2026', lat: -8.1965, lng: 113.6840 },
  { id: '9',  employeeName: 'VINKCY FIRMAN PRATAMA',  type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '09:11:54 WIB', date: '12-03-2026', lat: -8.2003, lng: 113.6797 },
  { id: '10', employeeName: 'Salsabila Nur Shinta',   type: 'check-in',  statusIn: 'others',          locationStatus: 'In Zone',  time: '09:01:45 WIB', date: '12-03-2026', lat: -8.1997, lng: 113.6790 },
]

// ─── Issue Attendance Data ────────────────────────────────────────────────────
export const issueAttendances = attendanceRecords.slice(0, 10).map(r => ({
  id: r.id,
  type: 'check-in' as const,
  userName: r.employeeName,
  statusIn: r.statusIn,
  locationIn: r.locationIn,
  time: r.timeIn,
}))

// ─── Company Data ─────────────────────────────────────────────────────────────
export const companyData = {
  logoUrl: null,
  companyName: 'PT NANO INDONESIA SAKTI',
  companyPhone: '',
  companyId: 'pt-nanoindonesiasakti',
  cutOffDate: '1',
  companyEmail: '',
  companyAddress: 'Jl. Imam Bonjol, Royal City Icon, Milan, J25',
  plan: 'umkm',
  onboardedFrom: '18 November 2025',
  onboardedTo: '18 November 2026',
  daysLeft: 250,
  picEmail: 'hr@nano.co.id',
}

// ─── Chart Data ───────────────────────────────────────────────────────────────
export const attendanceChartData = [
  { date: '01 Mar', hadir: 12, terlambat: 2, absen: 1 },
  { date: '02 Mar', hadir: 14, terlambat: 1, absen: 0 },
  { date: '03 Mar', hadir: 11, terlambat: 3, absen: 2 },
  { date: '04 Mar', hadir: 13, terlambat: 2, absen: 0 },
  { date: '05 Mar', hadir: 10, terlambat: 4, absen: 1 },
  { date: '06 Mar', hadir: 15, terlambat: 0, absen: 0 },
  { date: '07 Mar', hadir: 8,  terlambat: 1, absen: 4 },
  { date: '08 Mar', hadir: 0,  terlambat: 0, absen: 0 },
  { date: '09 Mar', hadir: 0,  terlambat: 0, absen: 0 },
  { date: '10 Mar', hadir: 12, terlambat: 3, absen: 1 },
  { date: '11 Mar', hadir: 14, terlambat: 2, absen: 0 },
  { date: '12 Mar', hadir: 3,  terlambat: 18, absen: 2 },
]
