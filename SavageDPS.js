function SavageDPS(currentLocation) {

    var edenVerse = ["Req: 83.7k", "Req: 86.7k", "Req: 90.4k"];
    var minRDPS = "";

    // Current Zone Names Paired with Min rDPS
    switch (currentLocation) {

        // E5S and E6S Ramuh and Pazuzu
        case (/\bFulmination/.test(currentLocation) ? currentLocation : false):
        case (/\bFuror/.test(currentLocation) ? currentLocation : false):
            minRDPS = edenVerse[0];
            break;

            // E7S Darkness
        case (/\bIconoclasm/.test(currentLocation) ? currentLocation : false):
            minRDPS = edenVerse[1];
            break;

            // E8S Shiva
        case (/\bRefulgence/.test(currentLocation) ? currentLocation : false):
            minRDPS = edenVerse[2];
            break;

            // Test
        case (/\bShirogane/.test(currentLocation) ? currentLocation : false):
            minRDPS = "Req: ∞";
            break;
        default:
            minRDPS = "";
            break;
    }

    return minRDPS;
}
