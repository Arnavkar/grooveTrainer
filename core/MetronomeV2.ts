// import type { Accelerator } from '../utils/types';
import { playSound } from '~/utils/utils';
import { audioPaths } from "../constants"
import { defaultAccelerator } from '~/constants';
import type { IMetronome } from '~/interfaces/IMetronome';
import BaseMetronome from './BaseMetronome';
//import type { BeatV2 } from '~/utils/types';

export default class MetronomeV2 extends BaseMetronome implements IMetronome {
    public accelerator: Accelerator = defaultAccelerator;
    public acceleratorEnabled: boolean = false;
    public numBeatsBeforeIncrement: number = 0;
    public currentBeatInAcceleratorLoop: number = 1;

    public audioContext: AudioContext | null = null;
    public audioBuffers: AudioBuffer[] = [];
    public nextNoteTime: number = 0; // Next note's scheduled time
    public scheduleAheadTime: number = 0.1; // How far ahead to schedule (in seconds)
    public timerInterval: number = 25;

    public get numBeats(): number {
        return this.beats.length;
    }

    public get beatUnit(): number[] {
        return this.beats.map((beat: Beat) => beat.beatUnit);
    }

    public async setup() {
        this.audioContext = new AudioContext();
        this.audioBuffers = await setUpAudioBuffers(this.audioContext, audioPaths);
        //this.setUpWorker()
    }

    private scheduler() {
        if (!this.audioContext) { console.error("No Audio Context"); return; }
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote();
            this.advanceNote();
        }
    }

    private scheduleNote() {
        if (!this.audioContext) { console.error("No Audio Context"); return; }
        const currentBeatIndex = this.activeBar;

        this.activeBar = (currentBeatIndex + 1) % this.numBeats;
        const isAccent = this.accents[this.activeBar] === 1;
        // Load or use pre-loaded audio buffer
        const buffer = isAccent ? this.audioBuffers[2] : this.audioBuffers[0];
        if (!buffer) return;

        if (this.activeBar >= 0)
            playSound(buffer, this.audioContext, this.nextNoteTime);
    }

    private advanceNote() {
        if (this.activeBar < 0) {
            return;
        }
        const beatDuration = (60 / this.bpm) / ((this.beats[this.activeBar]).beatUnit / 4);
        this.nextNoteTime += beatDuration;
        if (this.acceleratorEnabled){
            if (this.currentBeatInAcceleratorLoop == 0) {
                this.accelerator.progress = 100;
            } else {
                this.accelerator.progress = Math.floor(((this.currentBeatInAcceleratorLoop) / (this.numBeatsBeforeIncrement)) * 100)
            }

            this.currentBeatInAcceleratorLoop = (this.currentBeatInAcceleratorLoop + 1) % this.numBeatsBeforeIncrement;
            if (this.currentBeatInAcceleratorLoop == 1) {
                this.updateBpm(Math.min(this.accelerator.maxBpm, this.bpm + this.accelerator.bpmIncrement))
            }
        }

    }

    public updateBpm(newBpm: number) {
        if (!validateBPM(newBpm, this.errorCallback)) return;
        this.bpm = newBpm;
    }

    public updateTimeSignature(inputString: string) {
        try {
            this.beats = parseTimeSignature(inputString, this.bpm);
            this.setAccents();
            this.successCallback("Multiple time signature applied");
        } catch (e) {
            this.errorCallback((e as Error).message);
        }

        if (this.isRunning == true) {
            this.restart();
        }
    }

    public setAccents(){
        this.accents = this.beats.map((beat:Beat) => beat.isFirst? 1:0);
    }

    public override start() {
        super.start();
        if (!this.audioContext) { console.error("No Audio Context"); return; }

        if (this.acceleratorEnabled) {
            this.numBeatsBeforeIncrement = this.beats.length * this.accelerator.numBarsToRepeat;
        }
        this.currentBeatInAcceleratorLoop = 1;
        this.nextNoteTime = this.audioContext.currentTime;
        const timeoutId = window.setInterval(() => this.scheduler(), this.timerInterval);
        this.timeoutIds.push(timeoutId);
    }

    public override stop() {
        super.stop()
        this.numBeatsBeforeIncrement = 1000;
        this.currentBeatInAcceleratorLoop = 1;
        this.accelerator.progress = 0;
    }

    public toggleAccelerator() {
        this.acceleratorEnabled = !this.acceleratorEnabled;
        this.stop()
    }

    public setAccelerator(accelerator: Accelerator) {
        if (!validateAccelerator(accelerator, this.errorCallback)) return;
        this.stop();
        this.accelerator = accelerator;
        this.updateBpm(accelerator.startBPM);
        this.successCallback("Accelerator settings applied");
    }
}
