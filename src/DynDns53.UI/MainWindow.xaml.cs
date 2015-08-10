using Amazon;
using Amazon.Route53;
using DynDns53.Core;
using DynDns53.Core.Config;
using Hardcodet.Wpf.TaskbarNotification;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Windows.Threading;

namespace DynDns53.UI
{
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	public partial class MainWindow : Window
	{
        private WindowState storedWindowState = WindowState.Normal;
        private DnsUpdater _dnsUpdater;
        private IIpChecker _ipChecker;
        private IConfigHandler _configHandler;
        private DispatcherTimer _timer;


        public MainWindow()
		{
			InitializeComponent();
            InitConfig();
            AddLog("Application started");
        }

        private void InitConfig()
        {
            AddLog("Loading configuration values...");

            int interval = Int32.Parse(ConfigurationManager.AppSettings["UpdateInterval"]);
            
            _configHandler = new AppConfigHandler();
            var config = _configHandler.GetConfig();
            _ipChecker = new AwsIpChecker();
            IAmazonRoute53 _amazonClient = new AmazonRoute53Client(config.Route53AccessKey, config.Route53SecretKey, RegionEndpoint.EUWest1);
            _dnsUpdater = new DnsUpdater(_configHandler, _ipChecker, _amazonClient);
            
            AddLog($"Found {config.DomainList.Count} domain(s)");
            foreach (HostedDomainInfo domainInfo in config.DomainList)
            {
                AddLog($"{domainInfo.DomainName}");
            }

            if (_timer != null)
            {
                // Stop to avoid multiple timer_Tick invocations
                _timer.Stop();
            }
            
            _timer = new System.Windows.Threading.DispatcherTimer();
            _timer.Tick += timer_Tick;
            _timer.Interval = new TimeSpan(0, interval, 0);
            _timer.Start();

            AddLog($"Time set to update domains every {interval} minutes");

            SetAutoStart();
        }

        private void SetAutoStart()
        {
            RegistryKey currentUserRegistry = Registry.CurrentUser;
            RegistryKey runRegKey = currentUserRegistry.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
            var config = _configHandler.GetConfig();
            if (runRegKey != null)
            {
                if (config.RunAtSystemStart)
                {
                    runRegKey.SetValue("DynDns53.UI", System.Reflection.Assembly.GetExecutingAssembly().Location);
                }
                else
                {
                    runRegKey.DeleteValue("DynDns53.UI", false);
                }
            }
        }

        private void timer_Tick(object sender, EventArgs e)
        {
            Update();
        }

        private void updateButton_Click(object sender, RoutedEventArgs e)
        {
            Update();
        }

        private void Update()
        {
            try
            {
                _dnsUpdater.Update();

                string currentExternalIp = _ipChecker.GetExternalIp();

                string logMessage = $"Updated domains with current external IP {currentExternalIp}";
                AddLog(logMessage);
            }
            catch (Exception ex)
            {
                string logMessage = $"Error while updating domains: {ex.Message}";
                AddLog(logMessage, true);
            }
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }

        void OnClose(object sender, CancelEventArgs args)
        {
            notifyIcon.Dispose();
            notifyIcon = null;
        }
        
        void OnStateChanged(object sender, EventArgs args)
        {
            if (WindowState == WindowState.Minimized)
            {
                Hide();

                if (notifyIcon != null)
                {
                    notifyIcon.ShowBalloonTip("Dyndns53", "DynDns53 is running in the background", BalloonIcon.Info);
                }
            }
            else
            {
                storedWindowState = WindowState;
            }
        }

        void OnIsVisibleChanged(object sender, DependencyPropertyChangedEventArgs args)
        {
            CheckTrayIcon();
        }

        void notifyIcon_Click(object sender, EventArgs e)
        {
            Show();

            WindowState = storedWindowState;
        }

        void CheckTrayIcon()
        {
            ShowTrayIcon(!IsVisible);
        }

        void ShowTrayIcon(bool show)
        {
            if (notifyIcon != null)
            {
                notifyIcon.Visibility = Visibility.Visible;
            }
        }

        private void settingsButton_Click(object sender, RoutedEventArgs e)
        {
            SettingsWindow settings = new SettingsWindow();
            settings.ConfigHandler = _configHandler;
            settings.ShowDialog();

            if (settings.ReloadConfig)
            {
                InitConfig();
            }
        }

        private void AddLog(string message, bool error = false)
        {
            string logMessage = $"[{DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}] {message}";

            if (!error)
            {
                logListBox.Items.Insert(0, logMessage);
            }
            else
            {
                var newItem = new ListBoxItem() { Foreground = new SolidColorBrush(Color.FromRgb(255, 0, 0)), Content = logMessage };
                logListBox.Items.Insert(0, newItem);
            }

            logListBox.SelectedItem = logListBox.Items[0];
        }

        private void MenuItemClearAll_Click(object sender, RoutedEventArgs e)
        {
            logListBox.Items.Clear();
        }
    }
}
