/**
 * Grove RealTimeClock extension with PCF85063TP for calliope.
 * I2C interface.
 *
 * Thanks to Ingo Hoffmann for the great idea.
 * www.hackster.io/supereugen/genaue-echtzeituhr-abfragen-2ad9ef
 * 
 * SPEC: www.nxp.com/docs/en/data-sheet/PCF85063TP.pdf
 * 
 * @author Raik Andritschke
 *
 * INT and CLK funtions copied from PCF85063 extension by Marcel André
 *
 */

enum DateTime_Format {
    //% block="DD"
    DateTime_Date,
    //% block="MM"
    DateTime_Month,
    //% block="YYYY"
    DateTime_Year,
    //% block="HH24"
    DateTime_Hour,
    //% block="MI"
    DateTime_Min,
    //% block="SS"
    DateTime_Sec,
    //% block="DAY"
    DateTime_Day,
    //% block="WEEKDAY"
    DateTime_WeekDay
}

enum CLK_Type {
    //% block="32768 Hz"
    CLK_32768,
    //% block="16384 Hz"
    CLK_16384,
    //% block="8192 Hz"
    CLK_8192,
    //% block="4096 Hz"
    CLK_4096,
    //% block="2048 Hz"
    CLK_2048,
    //% block="1024 Hz"
    CLK_1024,
    //% block="1 Hz"
    CLK_1,
    //% block="Off"
    CLK_Off
}

enum INT_Type {
    //% block="60 sec"
    INT_60,
    //% block="30 sec"
    INT_30,
    //% block="Off"
    INT_Off
}

//% weight=10 color=#2874a6  icon="\uf017"
namespace PCF85063TP {
    let PCF85063TP_ADDR = 0x51;
    
    const CTRL_YEAR = 0x0A;
    const CTRL_MONTH = 0x09;
    const CTRL_WEEKDAY = 0x08;
    const CTRL_DAY = 0x07;
    const CTRL_HOURS = 0x06
    const CTRL_MINUTES = 0x05;
    const CTRL_SECONDS = 0x04;
    const CTRL_CONTROL = 0x00;
    const CTRL_STOP = 0x0021;
    const CTRL_START = 0x0001;
	
    let year = 0;
    let month = 0;
    let weekday = 0;
    let weekday_str = "";
    let day = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let rtcModule = 0;
    let ctrl_reg0 = 0;                          // Content Control Register 0
    let ctrl_reg1 = 0;                          // Content Control Register 1
    let mask = 0b00000000;
    let new_reg = 0b00000000;

    const MinuteEventID = 3101;
    let InGetClock = false;
    let LastMinutes = 0;

    function DECtoBCD(n: number): number {
        //return (n / 10 * 16) + (n % 10);
	let s = n.toString();
        let m = 0;
        let bcd = 0;
        let shiftcount = 0;
        for (let i = s.length; i > 0; i--) {
            m = parseInt(s[i - 1]);
            bcd = bcd + (m << shiftcount);
            shiftcount = shiftcount + 4;
        }
        return bcd;
    }

    function BCDtoDEC(n: number): number {
        //return (n / 16 * 10) + (n % 16);
	return (n & 15) + (((n & 240) >> 4) * 10) + (((n & 3840) >> 8) * 100) + (((n & 61440) >> 12) * 1000);
    }

    // 
    function getClock() {
        if (!InGetClock) {
            InGetClock = true;
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            seconds = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            minutes = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            hours = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            day = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            weekday = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            month = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
            year = BCDtoDEC(rtcModule)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
            switch (weekday) {
                case 0:
                    weekday_str = "Sonntag";
                    break;
                case 1:
                    weekday_str = "Montag";
                    break;
                case 2:
                    weekday_str = "Dienstag";
                    break;
                case 3:
                    weekday_str = "Mittwoch";
                    break;
                case 4:
                    weekday_str = "Donnerstag";
                    break;
                case 5:
                    weekday_str = "Freitag";
                    break;
                case 6:
                    weekday_str = "Samstag";
                    break;
            }
            year = 2000 + year;
        InGetClock = false;
        }
    }

    function leadingZero(s: string, len: number) {
        for (let i = 1; i <= (len - s.length); i++) {
            s = '0' + s;
        }
        return s;
    }

    //% blockId="getTime" block="Lese Uhrzeit"
    export function getTime(): string {
        getClock();
        let datestr = leadingZero(hours.toString(), 2) + ":" +
            leadingZero(minutes.toString(), 2) + ":" +
            leadingZero(seconds.toString(), 2)
        return datestr;
    }

    //% blockId="getDate" block="Lese Datum"
    export function getDate(): string {
        getClock();
        let timestr = leadingZero(day.toString(), 2) + "." +
            leadingZero(month.toString(), 2) + "." +
            leadingZero(year.toString(), 4)
        return timestr;
    }

    //% blockId="getDateTimePartNum" block="Lese Teil von DatumZeit Anteil %part als Zahl"
    export function getDateTimePartNum(part: DateTime_Format): number {
        getClock();
        let timenum = 0;
        switch (part) {
            case DateTime_Format.DateTime_Date:
                timenum = day
                break;
            case DateTime_Format.DateTime_Month:
                timenum = month
                break;
            case DateTime_Format.DateTime_Year:
                timenum = year
                break;
            case DateTime_Format.DateTime_Hour:
                timenum = hours
                break;
            case DateTime_Format.DateTime_Min:
                timenum = minutes
                break;
            case DateTime_Format.DateTime_Sec:
                timenum = seconds
                break;
            case DateTime_Format.DateTime_Day:
                timenum = weekday
                break;
            case DateTime_Format.DateTime_WeekDay:
                timenum = weekday
                break;
        }
        return timenum;
    }

    //% blockId="getDateTimePart" block="Lese Teil von DatumZeit Anteil %part als Text"
    export function getDateTimePart(part: DateTime_Format): string {
        getClock();
        let timestr = '';
        switch (part) {
            case DateTime_Format.DateTime_Date:
                timestr = leadingZero(day.toString(), 2);
                break;
            case DateTime_Format.DateTime_Month:
                timestr = leadingZero(month.toString(), 2);
                break;
            case DateTime_Format.DateTime_Year:
                timestr = leadingZero(year.toString(), 4)
                break;
            case DateTime_Format.DateTime_Hour:
                timestr = leadingZero(hours.toString(), 2)
                break;
            case DateTime_Format.DateTime_Min:
                timestr = leadingZero(minutes.toString(), 2)
                break;
            case DateTime_Format.DateTime_Sec:
                timestr = leadingZero(seconds.toString(), 2)
                break;
            case DateTime_Format.DateTime_Day:
                timestr = weekday.toString()
                break;
            case DateTime_Format.DateTime_WeekDay:
                timestr = weekday_str
                break;
        }
        return timestr;
    }

    //% blockId="setClock" block="Setze Datum und Uhrzeit Jahr %year | Monat %month | Wochentag %weekday | Tag %day | Stunden %hours | Minuten %minutes | Sekunden %seconds"
    //% year.min=2000 year.max= 2099 month.min=1 month.max=12 weekday.min=0 weekday.max=6
    //% day.min=1 day.max=31 hours.min=1 hours.max=23 minutes.min=1 minutes.max=59 seconds.min=1 seconds.max=59
    export function setClock(year: number, month: number, weekday: number,
        day: number, hours: number, minutes: number, seconds: number) {
        if ((year < 2000) || (year > 2099)) { return }
        if ((month < 1) || (month > 12)) { return }
        if ((weekday < 0) || (weekday > 6)) { return }
        if ((day < 1) || (day > 31)) { return }
        if ((hours < 0) || (hours > 23)) { return }
        if ((minutes < 0) || (minutes > 59)) { return }
        if ((seconds < 0) || (seconds > 59)) { return }
        year = year - 2000;
        pins.i2cWriteNumber(PCF85063TP_ADDR, CTRL_STOP, NumberFormat.UInt16BE) // control 1 stop
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_SECONDS << 8) + DECtoBCD(seconds), NumberFormat.UInt16BE) // seconds
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_MINUTES << 8) + DECtoBCD(minutes), NumberFormat.UInt16BE) // minutes
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_HOURS << 8) + DECtoBCD(hours), NumberFormat.UInt16BE) // hours
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_DAY << 8) + DECtoBCD(day), NumberFormat.UInt16BE) // day
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_WEEKDAY << 8) + DECtoBCD(weekday), NumberFormat.UInt16BE) // weekday
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_MONTH << 8) + DECtoBCD(month), NumberFormat.UInt16BE) // month
        pins.i2cWriteNumber(PCF85063TP_ADDR, (CTRL_YEAR << 8) + DECtoBCD(year), NumberFormat.UInt16BE) // year
        pins.i2cWriteNumber(PCF85063TP_ADDR, CTRL_START, NumberFormat.UInt16BE) // control 1 start
    }

    //% blockId=onMinuteEvent block="zu jeder vollen Minute"
    export function onMinuteEvent(handler: () => void) {
        control.onEvent(MinuteEventID, EventBusValue.MICROBIT_EVT_ANY, handler);
        control.inBackground(() => {
            while (true) {
                getClock()
                if ((minutes > LastMinutes) && (seconds == 0)) {  
                    LastMinutes = minutes;
                    if (LastMinutes == 59) { 
                        LastMinutes = -1
                    }
                    control.raiseEvent(MinuteEventID, 0);
	            basic.pause(500);
                }
                basic.pause(500);
            }
        })
    }

    function getControlRegisters() {
        // skip clock registers
        for (let i = 1; i <= 9; i++) {
             rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
        }

        // Read Control Registers
        rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
        ctrl_reg0 = rtcModule

        rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE) % 256
        ctrl_reg1 = rtcModule
    }

    //% blockId="setClk" block="Setze CLK Ausgangsfrequenz %clk"
    //% group="Advanced"
    export function setClk(clk: CLK_Type) {
        getControlRegisters();
        mask = 0b11111000;
        new_reg = ctrl_reg1 & mask; // delete last 3 bits
        switch (clk) {
            case CLK_Type.CLK_32768:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 0, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_16384:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 1, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_8192:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 2, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_4096:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 3, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_2048:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 4, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_1024:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 5, NumberFormat.UInt16BE);
                break;
             case CLK_Type.CLK_1:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 6, NumberFormat.UInt16BE);
                break;
            case CLK_Type.CLK_Off:
                pins.i2cWriteNumber(PCF85063TP_ADDR, (1 << 8) + new_reg + 7, NumberFormat.UInt16BE);
                break;
        }

        // Perform 11-1 / 18-1 read operations to get pointer back to correct position
        for (let i = 1; i <= 10; i++) {
            rtcModule = pins.i2cReadNumber(PCF85063TP_ADDR, NumberFormat.UInt16BE)
        }
    }

}
