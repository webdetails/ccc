
pvc.time = {
    intervals: {
        'y':   31536e6,

        'm':   2592e6,
        'd30': 2592e6,

        'w':   6048e5,
        'd7':  6048e5,

        'd':   864e5,
        'h':   36e5,
        'M':   6e4,
        's':   1e3,
        'ms':  1
    },

    withoutTime: function(t) {
        return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    },

    weekday: {
        previousOrSelf: function(t, toWd) {
            var wd = t.getDay(),
                difDays = wd - toWd;
            if(difDays) {
                // Round to the previous wanted week day
                var previousOffset = difDays < 0 ? (7 + difDays) : difDays;
                t = new Date(t - previousOffset * pvc.time.intervals.d);
            }
            return t;
        },

        nextOrSelf: function(t, toWd) {
            var wd = t.getDay(),
                difDays = wd - toWd;
            if(difDays) {
                // Round to the next wanted week day
                var nextOffset = difDays > 0 ? (7 - difDays) : -difDays;
                t = new Date(t + nextOffset * pvc.time.intervals.d);
            }
            return t;
        },

        closestOrSelf: function(t, toWd) {
            var wd = t.getDay(), // 0 - Sunday, ..., 6 - Friday
                difDays = wd - toWd;
            if(difDays) {
                var D = pvc.time.intervals.d,
                    sign = difDays > 0 ? 1 : -1;
                difDays = Math.abs(difDays);
                t = (difDays >= 4)
                    ? new Date(t.getTime() + sign * (7 - difDays) * D)
                    : new Date(t.getTime() - sign * difDays * D);
            }
            return t;
        }
    }
};
