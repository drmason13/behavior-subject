import { BehaviorSubject } from "rxjs";
import { DateTime, Duration } from "luxon";

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from 'node:process';

const sqlFormat = 'yyyy-MM-dd HH:mm:ss';


const makeDashboard = () => {
    const now = DateTime.fromFormat("2022-01-01 09:00:00", sqlFormat);

    const start = now.minus(Duration.fromObject({ minutes: 30 }));
    const end = now.plus(Duration.fromObject({ minutes: 30 }));

    return {
        start,
        end,

        dateRange$: new BehaviorSubject({ start, end }),

        broadcastDateRange(start, end) {
            this.dateRange$.next({ start, end });
        },
    }
}

let dashboard = makeDashboard();

const dashboardProxy = new Proxy(dashboard, {
    set(obj, prop, value) {
        if (prop === 'start' || prop === 'end') {

            const datetime = DateTime.fromFormat(value, sqlFormat);

            if (!datetime.isValid) {
                console.error(`Invalid DateTime ${value}: ${datetime.invalid.explanation}`);
                return obj[prop];
            }

            // this sets the value for us
            const result = Reflect.set(obj, prop, datetime);

            // this brodcasts the new value to all observers
            obj.broadcastDateRange(obj.start, obj.end);

            return result
        }
    }
})

dashboard.dateRange$.subscribe(dateRange => {
    console.log("Subscription got: start =", dateRange.start.toFormat(sqlFormat) + ",", "end =", dateRange.end.toFormat(sqlFormat));
})

const rl = readline.createInterface({ input, output });

let answer = await rl.question('When to start from? ');
dashboardProxy.start = answer;

answer = await rl.question('When to end? ');
dashboardProxy.end = answer;

rl.close();

// 2023-01-01 09:00:00
// 2023-02-01 13:00:00