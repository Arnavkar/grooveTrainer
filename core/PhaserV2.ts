import { playSound } from '~/utils/utils';
import { audioPaths } from "../constants"
import BaseMetronome from './BaseMetronome';

export default class PhaserV2 extends BaseMetronome {
    public bpmList = [120,60]
    public get beats(): Beat[] {
        const beats = []
        for (let i = 0; i < this.bpmList.length; i++) {
            beats.push({
                beatIndex:i,
                beatUnit: 4,
                accent: 0
            } as Beat)
        }
        return beats
    }



    public audioContext: AudioContext | null = null;
    public audioBuffers: AudioBuffer[] = [];
    public nextNoteTimes: number[] = [0,0]; // Next note's scheduled time
    public scheduleAheadTime: number = 0.1; // How far ahead to schedule (in seconds)
    public timerInterval: number = 25;

    public async setup() {
        this.audioContext = new AudioContext();
        this.audioBuffers = await setUpAudioBuffers(this.audioContext, audioPaths);
    }

    private scheduler(index:number) {
        if (!this.audioContext) { console.error("No Audio Context"); return; }
        while (this.nextNoteTimes[index] < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(index);
            this.advanceNote(index);
        }
    }

    private scheduleNote(index:number) {
        if (!this.audioContext) { console.error("No Audio Context"); return; }
        const bufferIndex = this.beats[index].accent;
        const buffer = bufferIndex >= 0 ? this.audioBuffers[bufferIndex] : undefined
        console.log(index)
        if (!buffer) return;

        
        playSound(buffer, this.audioContext, this.nextNoteTimes[index]);
    }

    private advanceNote(index:number) {
        const beatDuration = (60 / this.bpmList[index]) //beat unit is always 4
        this.nextNoteTimes[index] += beatDuration;
    }

    public override start() {
        super.start();
        if (!this.audioContext) { console.error("No Audio Context"); return; }
        this.nextNoteTimes = this.bpmList.map(() => this.audioContext!.currentTime);
        for (let i = 0; i < this.bpmList.length; i++) {
            console.log("Starting", i)
            const timeoutId = window.setInterval(() => this.scheduler(i), this.timerInterval);
            this.timeoutIds.push(timeoutId);
        }
    }

    public addBpm(){
        this.bpmList.push(120)
    }

    public removeBpm(){
        this.bpmList.pop()
    }
}