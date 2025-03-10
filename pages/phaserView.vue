<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <Transition name="fade-slide">
      <div v-if="renderPage" class="flex flex-row items-center justify-between w-10/12" >

        <!-- DESKTOP VIEW -->
        <div v-if="!isMobileDevice" class="flex flex-row items-center justify-between w-10/12">
          <BaseCard :isTabbed="false" :size="'96'" class="w-full">
            <div id="slidebeatcontainer" class="items-start w-11/12 border-l-4 border-r-4 border-accent">
              <SlidingBeats 
                :bpms="phaser.bpmList" 
                :isRunning="phaser.isRunning" 
                :beats="phaser.beats"
                :width="width"/>
            </div>
          </BaseCard>
          <BpmListInput
            :bpmList="phaser.bpmList"
            :beats="phaser.beats"
            :addBpm="phaser.addBpm"
            :removeBpm="phaser.removeBpm"/>
          <button @click="togglePhaser" class="btn btn-primary ml-2  h-3/5">{{ phaser.isRunning ? 'Stop' : 'Start' }}</button>
        </div>

        <!-- MOBILE VIEW -->
        <div v-if="isMobileDevice" class="flex flex-col items-center justify-center w-full">
          <BaseCard :isTabbed="false" :size="'96'" class="w-full">
            <div id="slidebeatcontainer" class="items-start w-full border-l-4 border-r-4 border-accent">
              <SlidingBeats 
                :bpms="phaser.bpmList" 
                :isRunning="phaser.isRunning" 
                :beats="phaser.beats"
                :width="width"/>
            </div>
          </BaseCard>
          <div class="flex items-center">
          <ModalCard 
              :modal-id="phaserModalId"
               @click="showModalById(phaserModalId)">
               <template #buttonui>
                <MdiIcon
                  icon="mdiCog"
                  class="text-primary" />
              </template>
              <template #modal>
                <BpmListInput
                :beats="phaser.beats"
                :bpmList="phaser.bpmList"
                :addBpm="phaser.addBpm"
                :removeBpm="phaser.removeBpm"/>
              </template>
            </ModalCard>
            <button @click="togglePhaser" class="btn btn-primary">{{ phaser.isRunning ? 'Stop' : 'Start' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, provide } from 'vue';
import type { Ref } from 'vue';
import { isMobile, showModalById } from '../utils/utils';
import SlidingBeats from '~/components/SlidingBeats.vue';
import BpmListInput from '~/components/BpmListInput.vue';
import BaseCard from '~/components/BaseCard.vue';
import PhaserV2 from '~/core/PhaserV2';

//eslint-disable-next-line
const snackbar = useSnackbar();
const phaser = reactive(new PhaserV2());
const renderPage: Ref<boolean> = ref(false);
const width: Ref<number> = ref(0);
const isMobileDevice: Ref<boolean | null> = ref(null);
const phaserModalId = 'phaserModal';

function showPage() {
  window.setTimeout(() => {
    renderPage.value = true;
  }, 200);
}

function throwError(message: string) {
  if (!snackbar) return;
  snackbar.add({
    type: 'error',
    text: message
  })
}

function throwSuccess(message: string) {
  snackbar.add({
    type: 'success',
    text: message
  })
}

function getWidth(){
  const elem = document.getElementById("slidebeatcontainer");
  width.value = elem? elem.offsetWidth : 0
}

function togglePhaser(){
  phaser.toggle()
  getWidth();
}

function incrementBeatAccent(index: number) {
  phaser.beats[index].accent = (phaser.beats[index].accent + 1) % 4;
}

provide('incrementBeatAccent',incrementBeatAccent)

onMounted(() => {
  showPage();
  getWidth();
  isMobileDevice.value = isMobile();
  phaser.addCallbacks(throwSuccess, throwError);

  if (phaser instanceof PhaserV2) phaser.setup();
});


</script>