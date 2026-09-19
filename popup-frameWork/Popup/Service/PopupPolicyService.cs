using Popup.Dtos;
using System;

namespace Popup.Services
{
    public class PopupPolicyService
    {
        private readonly PopupStorageService _storageService;

        /*
         * 팝업 정책 서비스 생성
         *
         * storageService
         * → 사용자가 숨김 처리한 팝업 정보를
         *   저장하고 조회하는 서비스
         */
        public PopupPolicyService(
            PopupStorageService storageService)
        {
            _storageService = storageService;
        }

        /*
         * 현재 팝업을 표시할 수 있는지 확인
         *
         * true
         * → 팝업 표시 가능
         *
         * false
         * → 팝업 표시 제외
         */
        public bool CanShow(PopupResponseDto popupDto)
        {
            DateTime now = DateTime.Now;

            /*
             * 노출 시작 일시보다 현재 시간이 이전이면
             * 아직 표시할 수 없음
             */
            if (popupDto.DisplayStartAt.HasValue &&
                now < popupDto.DisplayStartAt.Value)
            {
                return false;
            }

            /*
             * 노출 종료 일시보다 현재 시간이 이후이면
             * 더 이상 표시할 수 없음
             */
            if (popupDto.DisplayEndAt.HasValue &&
                now > popupDto.DisplayEndAt.Value)
            {
                return false;
            }

            /*
             * 사용자가 해당 팝업을 숨김 처리했고
             * 아직 숨김 기간이 끝나지 않았다면 표시하지 않음
             */
            if (_storageService.IsHidden(
                    popupDto.PopupId))
            {
                return false;
            }

            return true;
        }
    }
}