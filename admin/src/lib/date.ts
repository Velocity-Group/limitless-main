import moment from 'moment';

export function formatDate(date: Date, format = 'DD/MM/YYYY HH:mm') {
  return moment(date).format(format);
}

export function nowIsBefore(date: Date) {
  return moment().isBefore(date);
}
