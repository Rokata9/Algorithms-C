/* Dijkstra. Locking is only the line that takes the closest leftover. */

#include "types.h"

#include <stdio.h>

enum { s = 0, a, b, c, d, e, PLACE_COUNT };

#define HUGE 65000
#define MAX_ROADS 8

typedef struct {
    vertex_id to;
    weight time;
} Road;

static Road out[PLACE_COUNT][MAX_ROADS];
static int out_n[PLACE_COUNT];

static void add_road(vertex_id from, vertex_id to, weight time)
{
    out[from][out_n[from]].to = to;
    out[from][out_n[from]].time = time;
    out_n[from] += 1;
}

int main(void)
{
    /* Section 5 map. One-way roads, travel times on the arrows. */
    add_road(s, a, 4);
    add_road(s, b, 2);
    add_road(b, a, 1);
    add_road(a, c, 5);
    add_road(b, c, 8);
    add_road(b, d, 10);
    add_road(c, d, 2);
    add_road(c, e, 6);
    add_road(d, e, 3);

    weight guess[PLACE_COUNT];
    int waiting[PLACE_COUNT];
    int waiting_n;

    for (int i = 0; i < PLACE_COUNT; i++) {
        guess[i] = HUGE;
        waiting[i] = HUGE;
    }

    guess[s] = 0;
    waiting[s] = 0;
    waiting_n = 1;

    while (waiting_n > 0) {
        // find next closest waiting
        int u = HUGE;
        int value = HUGE;
        for (int i = 0; i < PLACE_COUNT; i++) {
            if (waiting[i] < value) {
                u = i;
                value = waiting[i];
            }
        }

        // we mark it as locked, we don't actually "pop",
        // but just set it to non-meaningful value
        waiting_n--;
        waiting[u] = HUGE;

        // go through all roads of u
        for (int i = 0; i < out_n[u]; i++) {
            int v = out[u][i].to;
            int w = out[u][i].time;

            if (guess[u] + w < guess[v]) {
                guess[v] = guess[u] + w;

                // is it waiting?
                if (waiting[v] != HUGE) {
                    waiting[v] = guess[v];
                    // "move v toward the top" in the original code, but we don't have
                    // priority queue here, we'll just find it eventually in the beginning
                    // of the while loop when it's closest
                } else {
                    waiting[v] = guess[v];
                    waiting_n++;
                }
            }
        }

        /* PICK the closest leftover on waiting, lock it in, then OFFER its roads. */
    }

    printf("s=%f\n", guess[s]);
    printf("a=%f\n", guess[a]);
    printf("b=%f\n", guess[b]);
    printf("c=%f\n", guess[c]);
    printf("d=%f\n", guess[d]);
    printf("e=%f\n", guess[e]);

    /* When finished, guesses on this map should be: s=0 a=3 b=2 c=8 d=10 e=13 */
    return 0;
}
