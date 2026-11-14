package util_test

import (
	"musica-server/util"
	"testing"
	"time"
)

func DateTest(dateString string, year int, month time.Month, day, hour, minute, second int, t *testing.T) {
	parsedTime, err := util.ParseYear(dateString)
	if err != nil {
		t.Errorf("util.ParseYear("+dateString+") Returned an error: %d", err.Error())
	}

	parsedYear, parsedMonth, parsedDay := parsedTime.Date()
	if parsedYear != year {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect year: %d (expected %d)", parsedYear, year)
	}
	if parsedMonth != month {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect month: %d (expected %d)", parsedMonth, month)
	}
	if parsedDay != day {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect day: %d (expected %d)", parsedDay, day)
	}

	parsedHour, parsedMinute, parsedSecond := parsedTime.Clock()
	if parsedHour != hour {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect hour: %d (expected %d)", parsedHour, hour)
	}
	if parsedMinute != minute {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect hour: %d (expected %d)", parsedMinute, minute)
	}
	if parsedSecond != second {
		t.Errorf("util.ParseYear("+dateString+") Returned incorrect second: %d (expected %d)", parsedSecond, second)
	}
}

func TestYearOnly(t *testing.T) {
	DateTest("2004", 2004, 1, 1, 0, 0, 0, t)
}

func TestRFC(t *testing.T) {
	DateTest("1996-12-19T16:39:57-08:00", 1996, 12, 19, 16, 39, 57, t)
}

func TestDayMonthYearDate(t *testing.T) {
	DateTest("14/7/2026", 2026, 7, 14, 0, 0, 0, t)
}

func TestInvalidDate(t *testing.T) {
	parsedTime, err := util.ParseYear("01/02/30004")
	if err == nil {
		t.Errorf("util.ParseYear(\"01/02/30004\") Did not return an error.")
	}

	if parsedTime != nil {
		t.Errorf("util.ParseYear(\"01/02/30004\") Returned a value.")
	}
}
