using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace Popup
{
    public partial class TextPopupWindow : Window
    {
        /*
         * 생성자
         *
         * TextPopupWindow를 만들 때 가장 먼저 실행된다.
         */
        public TextPopupWindow()
        {
            /*
             * XAML 파일을 읽어서
             * Grid, TextBlock, Button 같은 화면 요소를 만든다.
             */
            InitializeComponent();
        }

        /*
         * 닫기 버튼 클릭 이벤트
         *
         * XAML의 Click="CloseButton_Click"과 연결되어 있다.
         */
        private void CloseButton_Click(
            object sender,
            RoutedEventArgs e)
        {
            /*
             * 30일간 보지 않기 체크박스가
             * 선택되어 있는지 확인한다.
             *
             * 현재 단계에서는 실제 저장은 하지 않고
             * 확인 메시지만 띄운다.
             */
            if (DoNotShowAgainCheckBox.IsChecked == true)
            {
                MessageBox.Show(
                    "30일간 보지 않기가 선택되었습니다.",
                    "선택 확인");
            }

            /*
             * 현재 TextPopupWindow 창을 닫는다.
             */
            Close();
        }
        /*
         * 직접 만든 상단바를 마우스로 눌렀을 때 실행된다.
         *
         * XAML의
         * MouseLeftButtonDown="Header_MouseLeftButtonDown"
         * 부분과 연결되어 있다.
         */
        private void Header_MouseLeftButtonDown(
            object sender,
            MouseButtonEventArgs e)
        {
            /*
             * 마우스 왼쪽 버튼을 누른 상태인지 확인한다.
             *
             * 누른 상태가 아니라면 창을 이동시키지 않는다.
             */
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                /*
                 * 현재 Window를 마우스로 끌어서 이동시킨다.
                 *
                 * Windows 기본 제목 표시줄을 제거했기 때문에
                 * 우리가 직접 DragMove를 호출해야 한다.
                 */
                DragMove();
            }
        }
    }
}
